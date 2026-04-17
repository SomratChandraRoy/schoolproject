from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    Quiz,
    QuizAttempt,
    Analytics,
    SrijonshilQuestionSet,
    SrijonshilAttempt,
)

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


@admin.register(SrijonshilQuestionSet)
class SrijonshilQuestionSetAdmin(ModelAdmin):
    list_display = (
        'user',
        'subject',
        'class_level',
        'chapter',
        'difficulty',
        'provider_used',
        'is_submitted',
        'created_at',
    )
    list_filter = ('subject', 'class_level', 'difficulty', 'provider_used', 'is_submitted')
    search_fields = ('user__username', 'subject', 'chapter', 'uddipok')


@admin.register(SrijonshilAttempt)
class SrijonshilAttemptAdmin(ModelAdmin):
    list_display = (
        'user',
        'question_set',
        'total_marks',
        'evaluation_source',
        'submitted_at',
    )
    list_filter = ('evaluation_source', 'submitted_at')
    search_fields = ('user__username', 'question_set__subject', 'question_set__chapter')