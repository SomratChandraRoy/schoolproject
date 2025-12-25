from rest_framework import serializers
from .models import User, StudySession, Note

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'class_level', 
                 'fav_subjects', 'disliked_subjects', 'interests', 'total_points', 'is_student', 
                 'is_teacher', 'is_admin', 'is_member', 'is_banned', 'ban_reason', 'google_id', 'profile_picture',
                 'total_study_time', 'current_streak', 'longest_streak')
        read_only_fields = ('id', 'is_student', 'is_teacher', 'is_admin', 'is_member', 'is_banned', 'google_id', 'profile_picture')

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'class_level', 
                 'fav_subjects', 'disliked_subjects', 'interests', 'total_points', 'is_student', 
                 'is_teacher', 'is_admin', 'is_member', 'is_banned', 'ban_reason', 'google_id', 'profile_picture',
                 'total_study_time', 'current_streak', 'longest_streak')
        read_only_fields = ('id', 'username', 'email', 'is_student', 'is_teacher', 'is_admin', 
                           'is_member', 'is_banned', 'google_id', 'profile_picture')

class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = ('id', 'user', 'subject', 'duration', 'date', 'created_at')
        read_only_fields = ('id', 'user', 'date', 'created_at')

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ('id', 'user', 'title', 'content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')