from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta
from .models import User, StudySession
from .serializers import UserSerializer, UserProfileSerializer, StudySessionSerializer
from .permissions import IsAdmin

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

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class WorkOSAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # Log incoming request
        logger.info(f"WorkOS Auth Request - Data: {request.data}")
        
        # Initialize WorkOS
        workos = WorkOSClient(
            api_key=settings.WORKOS_API_KEY,
            client_id=settings.WORKOS_CLIENT_ID
        )
        
        # Get the authorization code from the request
        code = request.data.get('code')
        
        logger.info(f"Authorization code received: {code}")
        
        if not code:
            logger.error("No authorization code provided")
            return Response({
                'error': 'Authorization code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Exchange the authorization code for an access token
            logger.info(f"Attempting to exchange code with WorkOS...")
            profile_and_token = workos.sso.get_profile_and_token(code)
            
            logger.info(f"WorkOS response received: {type(profile_and_token)}")
            
            # Access profile as an attribute, not dictionary key
            profile = profile_and_token.profile
            
            # Convert profile to dictionary using Pydantic's model_dump()
            profile_dict = profile.model_dump()
            
            logger.info(f"Profile data: {profile_dict}")
            
            # Extract user information
            email = profile_dict.get('email')
            first_name = profile_dict.get('first_name') or None
            last_name = profile_dict.get('last_name') or None
            google_id = profile_dict.get('id', '')
            profile_picture = profile_dict.get('profile_picture_url', '')
            
            if not email:
                logger.error("No email in profile data")
                return Response({
                    'error': 'Email not provided by Google'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create or get user by email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                    'class_level': 9,  # Default to class 9
                    'google_id': google_id,
                    'profile_picture': profile_picture,
                }
            )
            
            logger.info(f"User {'created' if created else 'found'}: {user.email}")
            
            # Update Google OAuth fields if user already exists
            if not created:
                user.google_id = google_id
                user.profile_picture = profile_picture
                user.first_name = first_name or user.first_name
                user.last_name = last_name or user.last_name
                user.save()
            
            # Create token for the user
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