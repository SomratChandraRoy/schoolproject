from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from django.conf import settings
from workos import WorkOSClient
from rest_framework.authtoken.models import Token
import jwt as pyjwt
import re
import time
from .models import User, StudySession, Note
from .serializers import UserSerializer, UserProfileSerializer, StudySessionSerializer, NoteSerializer
from .permissions import IsAdmin
from quizzes.models import QuizAttempt
from games.models import GameSession
from books.models import Bookmark


ROOM_SLUG_REGEX = re.compile(r'[^a-zA-Z0-9_-]+')


def _normalize_room_slug(raw_room):
    room = (raw_room or '').strip()

    # Support users pasting a full room path and keep only the room slug.
    if '/' in room:
        room = room.split('/')[-1]

    room = ROOM_SLUG_REGEX.sub('-', room)
    room = room.strip('-_').lower()

    if not room:
        room = f'class-{int(time.time())}'

    return room[:120]

class UserDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get stats
        quizzes_taken = QuizAttempt.objects.filter(user=user).count()
        
        # Get games played - handle both old and new GameSession models
        try:
            # Try new model structure (player -> user)
            from games.models import PlayerProfile
            player_profile = PlayerProfile.objects.filter(user=user).first()
            if player_profile:
                games_played = GameSession.objects.filter(player=player_profile).count()
            else:
                games_played = 0
        except:
            # Fallback to old model structure if it exists
            games_played = 0
        
        # Count unique books bookmarked as a proxy for books read
        books_read = Bookmark.objects.filter(user=user).values('book').distinct().count()
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'stats': {
                'total_points': user.total_points,
                'quizzes_taken': quizzes_taken,
                'games_played': games_played,
                'books_read': books_read,
                'current_streak': user.current_streak,
                'longest_streak': user.longest_streak,
                'total_study_time': user.total_study_time
            }
        })

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            # Hash the password before saving
            password = request.data.get('password')
            if password:
                serializer.validated_data['password'] = make_password(password)
            
            user = serializer.save()
            # Set default roles
            user.is_student = True
            user.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudySessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        serializer = StudySessionSerializer(data=request.data)
        if serializer.is_valid():
            # Set the user automatically
            study_session = serializer.save(user=user)
            
            # Update user's total study time
            user.total_study_time += study_session.duration
            
            # Check if this is a new day for streak calculation
            today = timezone.now().date()
            yesterday = today - timedelta(days=1)
            
            # Get the last study session date
            last_session = StudySession.objects.filter(user=user).exclude(id=study_session.id).order_by('-date').first()
            
            if not last_session or last_session.date < today:
                # If no previous session or it was before today
                if not last_session or last_session.date == yesterday:
                    # Continued streak
                    user.current_streak += 1
                else:
                    # Broken streak
                    user.current_streak = 1
                
                # Update longest streak if needed
                if user.current_streak > user.longest_streak:
                    user.longest_streak = user.current_streak
                    
            user.save()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        # Get study sessions for the current user
        sessions = StudySession.objects.filter(user=request.user)
        serializer = StudySessionSerializer(sessions, many=True)
        return Response(serializer.data)

class StudyStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get total study time for the current week
        week_ago = timezone.now().date() - timedelta(days=7)
        weekly_study_time = StudySession.objects.filter(
            user=user, 
            date__gte=week_ago
        ).aggregate(total=Sum('duration'))['total'] or 0
        
        # Get subject breakdown
        subject_breakdown = StudySession.objects.filter(user=user).values('subject').annotate(
            total_duration=Sum('duration')
        ).order_by('-total_duration')
        
        return Response({
            'total_study_time': user.total_study_time,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
            'weekly_study_time': weekly_study_time,
            'subject_breakdown': list(subject_breakdown)
        })

class GlobalLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Top 20 students by total points
        top_students = User.objects.filter(is_student=True).order_by('-total_points')[:20]
        serializer = UserProfileSerializer(top_students, many=True)
        return Response(serializer.data)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class VideoCallTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        app_id = settings.JAAS_APP_ID
        domain = settings.JAAS_DOMAIN

        if not app_id:
            return Response({
                'error': 'Video call service is not configured on server (missing JAAS_APP_ID).'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        room_slug = _normalize_room_slug(
            request.data.get('room_name') or request.data.get('room')
        )
        full_room_name = f'{app_id}/{room_slug}'

        user = request.user
        default_name = f'{user.first_name} {user.last_name}'.strip() or user.username
        display_name = (request.data.get('display_name') or default_name).strip()

        token = None
        expires_at = None
        key_id = settings.JAAS_KID
        private_key = settings.JAAS_PRIVATE_KEY

        if key_id and private_key:
            issued_at = int(time.time())
            expires_at = issued_at + max(300, settings.JAAS_JWT_TTL_SECONDS)

            payload = {
                'aud': 'jitsi',
                'iss': 'chat',
                'sub': app_id,
                'room': room_slug,
                'iat': issued_at,
                'nbf': issued_at - 5,
                'exp': expires_at,
                'context': {
                    'user': {
                        'name': display_name,
                        'email': user.email or '',
                        'moderator': True,
                    }
                }
            }

            headers = {
                'kid': f'{app_id}/{key_id}',
                'typ': 'JWT',
                'alg': 'RS256',
            }

            try:
                token = pyjwt.encode(
                    payload,
                    private_key,
                    algorithm='RS256',
                    headers=headers,
                )
            except Exception as token_error:
                return Response({
                    'error': f'Failed to generate video token: {str(token_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        elif settings.JAAS_REQUIRE_AUTH_TOKEN:
            return Response({
                'error': 'JaaS JWT is required but JAAS_KID/JAAS_PRIVATE_KEY are missing.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'domain': domain,
            'app_id': app_id,
            'room_slug': room_slug,
            'room_name': full_room_name,
            'display_name': display_name,
            'script_url': f'https://{domain}/{app_id}/external_api.js',
            'jwt': token,
            'expires_at': expires_at,
            'requires_jwt': settings.JAAS_REQUIRE_AUTH_TOKEN,
        })


class WorkOSAuthURLView(APIView):
    """Generate WorkOS authorization URL for Google OAuth"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Validate settings
            if not settings.WORKOS_API_KEY or not settings.WORKOS_CLIENT_ID:
                logger.error("WorkOS credentials not configured")
                return Response({
                    'error': 'WorkOS credentials not configured. Please check your environment variables.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Build authorization URL manually (WorkOS User Management API)
            from urllib.parse import urlencode
            
            params = {
                'client_id': settings.WORKOS_CLIENT_ID,
                'redirect_uri': settings.WORKOS_REDIRECT_URI,
                'response_type': 'code',
                'provider': 'authkit'
            }
            
            authorization_url = f"https://api.workos.com/user_management/authorize?{urlencode(params)}"
            
            logger.info(f"Authorization URL generated successfully")
            
            return Response({
                'authorization_url': authorization_url
            })
        except ImportError as e:
            logger.error(f"Import error: {e}")
            return Response({
                'error': f'Import error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Failed to generate authorization URL: {str(e)}", exc_info=True)
            return Response({
                'error': f'Failed to generate authorization URL: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WorkOSAuthView(APIView):
    """Handle WorkOS OAuth callback and authenticate user"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # Log incoming request
        logger.info(f"WorkOS Auth Request - Data: {request.data}")
        
        # Get the authorization code from the request
        code = request.data.get('code')
        
        logger.info(f"Authorization code received: {code}")
        
        if not code:
            logger.error("No authorization code provided")
            return Response({
                'error': 'Authorization code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Initialize WorkOS client
            from workos import WorkOSClient
            
            workos = WorkOSClient(
                api_key=settings.WORKOS_API_KEY,
                client_id=settings.WORKOS_CLIENT_ID
            )
            
            logger.info(f"Attempting to exchange code with WorkOS...")
            
            # Exchange authorization code for user profile
            # Note: client_id is already set in WorkOSClient initialization
            auth_response = workos.user_management.authenticate_with_code(
                code=code
            )
            
            logger.info(f"WorkOS authentication response received")
            
            # Extract user information from auth_response
            user_data = auth_response.user
            email = user_data.email
            first_name = user_data.first_name if hasattr(user_data, 'first_name') else ''
            last_name = user_data.last_name if hasattr(user_data, 'last_name') else ''
            google_id = user_data.id
            profile_picture = user_data.profile_picture_url if hasattr(user_data, 'profile_picture_url') else ''
            
            if not email:
                logger.error("No email in profile data")
                return Response({
                    'error': 'Email not provided by authentication provider'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Extracted email: {email}, google_id: {google_id}")
            
            # First, try to find user by google_id (WorkOS user ID)
            # This is the most reliable identifier
            user = None
            created = False
            
            try:
                if google_id:
                    user = User.objects.get(google_id=google_id)
                    logger.info(f"Found existing user by google_id: {user.email}")
                    created = False
            except User.DoesNotExist:
                logger.info(f"No user found with google_id: {google_id}")
            except User.MultipleObjectsReturned:
                # If multiple users with same google_id (shouldn't happen), get the first one
                user = User.objects.filter(google_id=google_id).first()
                logger.warning(f"Multiple users found with google_id: {google_id}, using first one")
            
            # If not found by google_id, try by email
            if not user:
                try:
                    user = User.objects.get(email=email)
                    logger.info(f"Found existing user by email: {user.email}")
                    created = False
                except User.DoesNotExist:
                    logger.info(f"No user found with email: {email}, creating new user")
                    # Create new user
                    user = User.objects.create(
                        email=email,
                        username=email.split('@')[0],
                        first_name=first_name or '',
                        last_name=last_name or '',
                        class_level=9,  # Default to class 9
                        google_id=google_id,
                        profile_picture=profile_picture,
                        is_student=True,  # Default role
                    )
                    created = True
                    logger.info(f"Created new user: {user.email}")
                except User.MultipleObjectsReturned:
                    # Handle duplicate users with same email
                    logger.warning(f"Multiple users found with email: {email}")
                    # Get all users with this email
                    duplicate_users = User.objects.filter(email=email).order_by('date_joined')
                    
                    # Keep the first one (oldest), update it with google_id
                    user = duplicate_users.first()
                    logger.info(f"Using oldest user: {user.id} - {user.email}")
                    
                    # Delete the duplicates
                    for dup_user in duplicate_users[1:]:
                        logger.warning(f"Deleting duplicate user: {dup_user.id} - {dup_user.email}")
                        dup_user.delete()
                    
                    created = False
            
            logger.info(f"User {'created' if created else 'found'}: {user.email}")
            
            # Check if user is banned
            if user.is_banned:
                logger.warning(f"Banned user attempted login: {user.email}")
                return Response({
                    'error': 'banned',
                    'message': 'You are banned. Contact our team.',
                    'ban_reason': user.ban_reason or 'No reason provided'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Update user fields with latest data from WorkOS
            user.google_id = google_id
            user.profile_picture = profile_picture
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            user.save()
            logger.info(f"Updated user data for: {user.email}")
            
            # Create or get token for the user
            token, _ = Token.objects.get_or_create(user=user)
            
            logger.info(f"Authentication successful for {user.email}")
            
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
                'is_new_user': created
            })
            
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}", exc_info=True)
            return Response({
                'error': f'Authentication failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminPanelView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get(self, request):
        """Get admin dashboard data"""
        # Get statistics
        total_users = User.objects.count()
        total_teachers = User.objects.filter(is_teacher=True).count()
        total_admins = User.objects.filter(is_admin=True).count()
        
        # Get recent users
        recent_users = User.objects.order_by('-date_joined')[:10]
        
        return Response({
            'statistics': {
                'total_users': total_users,
                'total_teachers': total_teachers,
                'total_admins': total_admins
            },
            'recent_users': UserProfileSerializer(recent_users, many=True).data
        })
    
    def patch(self, request, user_id):
        """Update user role (promote/demote)"""
        try:
            user = User.objects.get(id=user_id)
            
            # Update user roles based on request data
            if 'is_teacher' in request.data:
                user.is_teacher = request.data['is_teacher']
            
            if 'is_admin' in request.data:
                user.is_admin = request.data['is_admin']
            
            user.save()
            
            return Response({
                'message': 'User updated successfully',
                'user': UserProfileSerializer(user).data
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

class NoteSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        notes_data = request.data.get('notes', [])
        synced_notes = []

        for note_data in notes_data:
            note_payload = {
                'title': note_data.get('title', 'Untitled'),
                'content': note_data.get('content', ''),
            }

            # If backend ID exists, update
            if note_data.get('id'):
                try:
                    note_id = int(note_data['id'])
                    note = Note.objects.get(id=note_id, user=request.user)
                    serializer = NoteSerializer(note, data=note_payload, partial=True)
                    if serializer.is_valid():
                        serializer.save()
                        synced_notes.append(serializer.data)
                except (Note.DoesNotExist, TypeError, ValueError):
                    # Treat as new if ID not found (unlikely but safe)
                    serializer = NoteSerializer(data=note_payload)
                    if serializer.is_valid():
                        serializer.save(user=request.user)
                        synced_notes.append(serializer.data)
            else:
                # Create new
                serializer = NoteSerializer(data=note_payload)
                if serializer.is_valid():
                    serializer.save(user=request.user)
                    synced_notes.append(serializer.data)
        
        return Response(synced_notes)


class UpdateUserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        
        # Update class level if provided
        if 'class_level' in request.data:
            user.class_level = request.data['class_level']
        
        # Update favorite subjects if provided
        if 'fav_subjects' in request.data:
            user.fav_subjects = request.data['fav_subjects']
        
        # Update disliked subjects if provided
        if 'disliked_subjects' in request.data:
            user.disliked_subjects = request.data['disliked_subjects']
        
        # Update interests if provided
        if 'interests' in request.data:
            user.interests = request.data['interests']
        
        user.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': UserProfileSerializer(user).data
        })
    
    def delete(self, request, user_id):
        """Ban/Delete user"""
        try:
            user = User.objects.get(id=user_id)
            
            # Don't allow admins to delete themselves
            if user.is_admin and user == request.user:
                return Response({
                    'error': 'You cannot delete yourself'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.delete()
            
            return Response({
                'message': 'User deleted successfully'
            })
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)