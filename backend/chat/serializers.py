from rest_framework import serializers
from .models import ChatRoom, Message, MessageReaction, TypingStatus
from accounts.models import User


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for chat"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'is_member']


class MessageReactionSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = MessageReaction
        fields = ['id', 'message', 'user', 'emoji', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'chatroom', 'sender', 'message_type', 'content', 'file_url', 
                  'file_name', 'file_size', 'is_read', 'created_at', 'reactions']
        read_only_fields = ['sender', 'created_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    participant1 = UserBasicSerializer(read_only=True)
    participant2 = UserBasicSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'participant1', 'participant2', 'other_participant', 
                  'last_message', 'unread_count', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other = obj.get_other_participant(request.user)
            return UserBasicSerializer(other).data
        return None


class TypingStatusSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = TypingStatus
        fields = ['id', 'chatroom', 'user', 'is_typing', 'updated_at']
