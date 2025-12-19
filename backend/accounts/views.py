from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.conf import settings
from workos import WorkOSClient
from .models import User
from .serializers import UserSerializer, UserProfileSerializer
from .permissions import IsAdmin


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data
            })
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class WorkOSAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        # Initialize WorkOS
        workos = WorkOSClient(api_key=settings.WORKOS_API_KEY)
        
        # Get the authorization code from the request
        code = request.data.get('code')
        
        if not code:
            return Response({
                'error': 'Authorization code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Exchange the authorization code for an access token
            profile = workos.sso.get_profile_and_token(code)['profile']
            
            # Extract user information
            email = profile['email']
            first_name = profile.get('first_name', '')
            last_name = profile.get('last_name', '')
            
            # Create or get user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            
            # Create token for the user
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
                'is_new_user': created
            })
            
        except Exception as e:
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