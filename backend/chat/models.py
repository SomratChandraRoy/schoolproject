from django.db import models
from accounts.models import User
from django.utils import timezone


class ChatRoom(models.Model):
    """One-to-one chat room between two members"""
    participant1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_as_participant1')
    participant2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_as_participant2')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['participant1', 'participant2']
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Chat: {self.participant1.username} - {self.participant2.username}"
    
    def get_other_participant(self, user):
        """Get the other participant in the chat"""
        return self.participant2 if self.participant1 == user else self.participant1
    
    def get_unread_count(self, user):
        """Get unread message count for a user"""
        return self.messages.filter(sender=self.get_other_participant(user), is_read=False).count()


class Message(models.Model):
    """Chat message"""
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('voice', 'Voice'),
        ('file', 'File'),
    ]
    
    chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(blank=True)  # For text messages
    file_url = models.URLField(max_length=500, blank=True, null=True)  # For media files
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.IntegerField(blank=True, null=True)  # In bytes
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Google Drive fields (optional)
    drive_file_id = models.CharField(max_length=255, blank=True, null=True)  # Google Drive file ID
    drive_view_link = models.URLField(max_length=500, blank=True, null=True)  # View link
    drive_download_link = models.URLField(max_length=500, blank=True, null=True)  # Download link
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.message_type} at {self.created_at}"


class MessageReaction(models.Model):
    """Emoji reactions to messages"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)  # Emoji character
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to message {self.message.id}"


class TypingStatus(models.Model):
    """Track who is typing in a chatroom"""
    chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='typing_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_typing = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['chatroom', 'user']
    
    def __str__(self):
        return f"{self.user.username} typing in {self.chatroom.id}"
