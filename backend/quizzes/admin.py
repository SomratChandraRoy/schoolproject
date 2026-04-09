from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Quiz, QuizAttempt, Analytics

@admin.register(Quiz)
class QuizAdmin(ModelAdmin):
    list_display = ('subject', 'class_target', 'difficulty', 'question_text')
    list_filter = ('subject', 'class_target', 'difficulty')
    search_fields = ('question_text', 'subject')

@admin.register(QuizAttempt)
class QuizAttemptAdmin(ModelAdmin):
    list_display = ('user', 'quiz', 'is_correct', 'attempted_at')
    list_filter = ('is_correct', 'attempted_at')
    search_fields = ('user__username', 'quiz__question_text')

@admin.register(Analytics)
class AnalyticsAdmin(ModelAdmin):
    list_display = ('user', 'score', 'timestamp')
    list_filter = ('score', 'timestamp')
    search_fields = ('user__username',)