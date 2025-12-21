from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'class_level', 'fav_subjects', 
                  'disliked_subjects', 'total_points', 'is_teacher', 'is_admin')
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'class_level', 'fav_subjects', 
                  'disliked_subjects', 'total_points', 'is_teacher', 'is_admin',
                  'google_id', 'profile_picture', 'first_name', 'last_name')
        read_only_fields = ('id', 'username', 'email', 'is_teacher', 'is_admin', 'google_id')