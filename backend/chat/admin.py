from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import ChatRoom, Message, MessageReaction, TypingStatus


@admin.register(ChatRoom)
class ChatRoomAdmin(ModelAdmin):
    list_display = ['id', 'participant1', 'participant2', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['participant1__username', 'participant2__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(ModelAdmin):
    list_display = ['id', 'chatroom', 'sender', 'message_type', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['sender__username', 'content']
    readonly_fields = ['created_at']


@admin.register(MessageReaction)
class MessageReactionAdmin(ModelAdmin):
    list_display = ['id', 'message', 'user', 'emoji', 'created_at']
    list_filter = ['emoji', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at']


@admin.register(TypingStatus)
class TypingStatusAdmin(ModelAdmin):
    list_display = ['id', 'chatroom', 'user', 'is_typing', 'updated_at']
    list_filter = ['is_typing', 'updated_at']
    search_fields = ['user__username']
    readonly_fields = ['updated_at']
