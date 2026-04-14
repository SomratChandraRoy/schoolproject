from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
from .models import ChatRoom, Message, MessageReaction, TypingStatus
from .serializers import (
    ChatRoomSerializer, MessageSerializer, 
    MessageReactionSerializer, TypingStatusSerializer, UserBasicSerializer
)
from accounts.models import User

# Import Google Drive service if enabled
if settings.USE_GOOGLE_DRIVE:
    from .google_drive import get_drive_service


class IsMemberPermission(permissions.BasePermission):
    """Only chat-enabled roles can access chat"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_access_chat()


class MemberListView(viewsets.ReadOnlyModelViewSet):
    """List all members for search"""
    permission_classes = [IsMemberPermission]
    serializer_class = UserBasicSerializer
    
    def get_queryset(self):
        queryset = User.objects.filter(
            is_active=True,
        ).exclude(
            Q(role=User.ROLE_BAN) | Q(is_banned=True)
        ).exclude(id=self.request.user.id)

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        return queryset.order_by('first_name', 'username')[:40]


class ChatRoomViewSet(viewsets.ModelViewSet):
    """Manage chat rooms"""
    permission_classes = [IsMemberPermission]
    serializer_class = ChatRoomSerializer
    
    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')
    
    @action(detail=False, methods=['post'])
    def get_or_create(self, request):
        """Get or create a chat room with another user"""
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            other_user = User.objects.get(
                id=other_user_id,
                is_active=True,
            )
            if other_user.is_effectively_banned():
                raise User.DoesNotExist
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found or account is restricted'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if other_user == request.user:
            return Response(
                {'error': 'Cannot chat with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if chatroom exists (either direction)
        chatroom = ChatRoom.objects.filter(
            Q(participant1=request.user, participant2=other_user) |
            Q(participant1=other_user, participant2=request.user)
        ).first()
        
        if not chatroom:
            # Create new chatroom
            chatroom = ChatRoom.objects.create(
                participant1=request.user,
                participant2=other_user
            )
        
        serializer = self.get_serializer(chatroom)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in chatroom as read"""
        chatroom = self.get_object()
        other_participant = chatroom.get_other_participant(request.user)
        
        # Mark all unread messages from other participant as read
        Message.objects.filter(
            chatroom=chatroom,
            sender=other_participant,
            is_read=False
        ).update(is_read=True)
        
        return Response({'status': 'messages marked as read'})


class MessageViewSet(viewsets.ModelViewSet):
    """Manage messages"""
    permission_classes = [IsMemberPermission]
    serializer_class = MessageSerializer
    
    def get_queryset(self):
        chatroom_id = self.request.query_params.get('chatroom')
        if chatroom_id:
            # Verify user is participant in this chatroom
            chatroom = get_object_or_404(ChatRoom, id=chatroom_id)
            if self.request.user not in [chatroom.participant1, chatroom.participant2]:
                return Message.objects.none()
            return Message.objects.filter(chatroom=chatroom)
        return Message.objects.none()
    
    def perform_create(self, serializer):
        chatroom_id = self.request.data.get('chatroom')
        chatroom = get_object_or_404(ChatRoom, id=chatroom_id)
        
        # Verify user is participant
        if self.request.user not in [chatroom.participant1, chatroom.participant2]:
            raise permissions.PermissionDenied("You are not a participant in this chat")
        
        serializer.save(sender=self.request.user)
        
        # Update chatroom timestamp
        chatroom.save()  # This updates updated_at
    
    @action(detail=True, methods=['post'])
    def add_reaction(self, request, pk=None):
        """Add emoji reaction to message"""
        message = self.get_object()
        emoji = request.data.get('emoji')
        
        if not emoji:
            return Response(
                {'error': 'emoji is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update reaction
        reaction, created = MessageReaction.objects.update_or_create(
            message=message,
            user=request.user,
            defaults={'emoji': emoji}
        )
        
        serializer = MessageReactionSerializer(reaction)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def remove_reaction(self, request, pk=None):
        """Remove emoji reaction from message"""
        message = self.get_object()
        
        try:
            reaction = MessageReaction.objects.get(message=message, user=request.user)
            reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MessageReaction.DoesNotExist:
            return Response(
                {'error': 'Reaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TypingStatusViewSet(viewsets.ModelViewSet):
    """Manage typing status"""
    permission_classes = [IsMemberPermission]
    serializer_class = TypingStatusSerializer
    
    def get_queryset(self):
        chatroom_id = self.request.query_params.get('chatroom')
        if chatroom_id:
            return TypingStatus.objects.filter(chatroom_id=chatroom_id)
        return TypingStatus.objects.none()
    
    @action(detail=False, methods=['post'])
    def update_status(self, request):
        """Update typing status"""
        chatroom_id = request.data.get('chatroom')
        is_typing = request.data.get('is_typing', False)
        
        if not chatroom_id:
            return Response(
                {'error': 'chatroom is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        chatroom = get_object_or_404(ChatRoom, id=chatroom_id)
        
        # Verify user is participant
        if request.user not in [chatroom.participant1, chatroom.participant2]:
            raise permissions.PermissionDenied("You are not a participant in this chat")
        
        typing_status, created = TypingStatus.objects.update_or_create(
            chatroom=chatroom,
            user=request.user,
            defaults={'is_typing': is_typing}
        )
        
        serializer = self.get_serializer(typing_status)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsMemberPermission])
def get_total_unread_count(request):
    """Get total unread message count across all chatrooms"""
    user = request.user
    
    # Get all chatrooms where user is a participant
    chatrooms = ChatRoom.objects.filter(
        Q(participant1=user) | Q(participant2=user)
    )
    
    total_unread = 0
    for chatroom in chatrooms:
        other_participant = chatroom.get_other_participant(user)
        unread_count = Message.objects.filter(
            chatroom=chatroom,
            sender=other_participant,
            is_read=False
        ).count()
        total_unread += unread_count
    
    return Response({'unread_count': total_unread})


@api_view(['POST'])
@permission_classes([IsMemberPermission])
def upload_file(request):
    """Upload file for chat message (supports local storage and Google Drive)"""
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    chatroom_id = request.data.get('chatroom_id') or request.data.get('chatroom')
    
    if not chatroom_id:
        return Response(
            {'error': 'chatroom_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify chatroom exists and user is participant
    try:
        chatroom = ChatRoom.objects.get(id=chatroom_id)
        if request.user not in [chatroom.participant1, chatroom.participant2]:
            return Response(
                {'error': 'You are not a participant in this chat'},
                status=status.HTTP_403_FORBIDDEN
            )
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Chatroom not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    if file.size > max_size:
        return Response(
            {'error': 'File size exceeds 50MB limit'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Determine message type based on file extension
    file_ext = os.path.splitext(file.name)[1].lower()
    image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    video_exts = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    
    if file_ext in image_exts:
        message_type = 'image'
    elif file_ext in video_exts:
        message_type = 'video'
    else:
        message_type = 'file'
    
    # Upload to Google Drive or local storage
    try:
        if settings.USE_GOOGLE_DRIVE:
            # Upload to Google Drive
            drive_service = get_drive_service()
            
            # Read file content
            file_content = file.read()
            
            # Get MIME type
            mime_type = file.content_type or 'application/octet-stream'
            
            # Upload to Drive
            drive_result = drive_service.upload_file(
                file_content=file_content,
                file_name=file.name,
                mime_type=mime_type,
                folder_id=settings.GOOGLE_DRIVE_FOLDER_ID or None
            )
            
            # Create message with Google Drive links
            message = Message.objects.create(
                chatroom=chatroom,
                sender=request.user,
                message_type=message_type,
                file_url=drive_result['view_link'],
                file_name=file.name,
                file_size=file.size,
                drive_file_id=drive_result['id'],
                drive_view_link=drive_result['view_link'],
                drive_download_link=drive_result.get('download_link', '')
            )
            
        else:
            # Upload to local storage
            file_path = f'chat_files/{chatroom_id}/{file.name}'
            saved_path = default_storage.save(file_path, ContentFile(file.read()))
            file_url = default_storage.url(saved_path)
            
            # Create message
            message = Message.objects.create(
                chatroom=chatroom,
                sender=request.user,
                message_type=message_type,
                file_url=file_url,
                file_name=file.name,
                file_size=file.size
            )
        
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'File upload failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
