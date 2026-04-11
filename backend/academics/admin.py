from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Subject, SyllabusTopic, StudyPlan

class SyllabusTopicInline(TabularInline):
    model = SyllabusTopic
    extra = 1

@admin.register(Subject)
class SubjectAdmin(ModelAdmin):
    list_display = ('name', 'user', 'progress_percentage', 'created_at')
    search_fields = ('name', 'user__username')
    list_filter = ('created_at',)
    inlines = [SyllabusTopicInline]

@admin.register(SyllabusTopic)
class SyllabusTopicAdmin(ModelAdmin):
    list_display = ('title', 'subject', 'status', 'is_important', 'order_index')
    list_filter = ('status', 'is_important')
    search_fields = ('title', 'subject__name', 'subject__user__username')
    ordering = ('subject', 'order_index')

@admin.register(StudyPlan)
class StudyPlanAdmin(ModelAdmin):
    list_display = ('title', 'user', 'target_exam_date', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'user__username')

