from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from django.db import models
from .models import User, StudySession, Note


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management with all fields"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 
                 'class_level', 'fav_subjects', 'disliked_subjects', 'interests', 
                 'total_points', 'is_student', 'is_teacher', 'is_admin', 'is_member', 'is_staff',
                 'is_superuser', 'is_banned', 'ban_reason', 'google_id', 'profile_picture', 
                 'total_study_time', 'current_streak', 'longest_streak', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login')


class StudySessionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = StudySession
        fields = '__all__'


class NoteSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Note
        fields = '__all__'


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for users"""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role == 'student':
            queryset = queryset.filter(is_student=True)
        elif role == 'teacher':
            queryset = queryset.filter(is_teacher=True)
        elif role == 'admin':
            queryset = queryset.filter(is_admin=True)
        
        # Search by email or username
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) | 
                models.Q(username__icontains=search) |
                models.Q(first_name__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Hash password if provided
        if 'password' in data:
            data['password'] = make_password(data['password'])
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        
        # Hash password if provided
        if 'password' in data and data['password']:
            data['password'] = make_password(data['password'])
        elif 'password' in data and not data['password']:
            # Remove password field if empty
            data.pop('password')
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        total_users = User.objects.count()
        students = User.objects.filter(is_student=True).count()
        teachers = User.objects.filter(is_teacher=True).count()
        admins = User.objects.filter(is_admin=True).count()
        banned_users = User.objects.filter(is_banned=True).count()
        
        return Response({
            'total_users': total_users,
            'students': students,
            'teachers': teachers,
            'admins': admins,
            'banned_users': banned_users
        })
    
    @action(detail=True, methods=['post'])
    def ban_user(self, request, pk=None):
        """Ban a user"""
        user = self.get_object()
        ban_reason = request.data.get('ban_reason', 'No reason provided')
        
        # Prevent banning admins (only superuser can ban admins)
        if user.is_admin and not request.user.is_superuser:
            return Response({
                'error': 'Only superusers can ban admin users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent self-ban
        if user == request.user:
            return Response({
                'error': 'You cannot ban yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Teachers cannot ban other teachers or admins
        if request.user.is_teacher and not request.user.is_admin:
            if user.is_teacher or user.is_admin:
                return Response({
                    'error': 'Teachers cannot ban other teachers or admins'
                }, status=status.HTTP_403_FORBIDDEN)
        
        user.is_banned = True
        user.ban_reason = ban_reason
        user.save()
        
        return Response({
            'message': f'User {user.username} has been banned',
            'user': self.get_serializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def unban_user(self, request, pk=None):
        """Unban a user"""
        user = self.get_object()
        
        # Teachers cannot unban users banned by admins
        if request.user.is_teacher and not request.user.is_admin:
            if user.is_teacher or user.is_admin:
                return Response({
                    'error': 'Teachers cannot unban teachers or admins'
                }, status=status.HTTP_403_FORBIDDEN)
        
        user.is_banned = False
        user.ban_reason = None
        user.save()
        
        return Response({
            'message': f'User {user.username} has been unbanned',
            'user': self.get_serializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role (promote/demote)"""
        user = self.get_object()
        
        # Teachers cannot change admin roles
        if request.user.is_teacher and not request.user.is_admin:
            if user.is_admin or request.data.get('is_admin'):
                return Response({
                    'error': 'Teachers cannot modify admin roles'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent self-demotion
        if user == request.user and request.data.get('is_admin') == False:
            return Response({
                'error': 'You cannot demote yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update roles
        if 'is_student' in request.data:
            user.is_student = request.data['is_student']
        if 'is_teacher' in request.data:
            user.is_teacher = request.data['is_teacher']
        if 'is_admin' in request.data and request.user.is_admin:
            user.is_admin = request.data['is_admin']
        
        user.save()
        
        return Response({
            'message': f'User {user.username} role updated',
            'user': self.get_serializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def toggle_member(self, request, pk=None):
        """Toggle member status for a user"""
        user = self.get_object()
        is_member = request.data.get('is_member')
        
        if is_member is None:
            # Toggle current status
            user.is_member = not user.is_member
        else:
            user.is_member = is_member
        
        user.save()
        
        return Response({
            'message': f'User {user.username} member status updated',
            'is_member': user.is_member,
            'user': self.get_serializer(user).data
        })


class AdminStudySessionViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for study sessions"""
    queryset = StudySession.objects.all()
    serializer_class = StudySessionSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = StudySession.objects.all().order_by('-created_at')
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset


class AdminNoteViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for notes"""
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Note.objects.all().order_by('-updated_at')
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
