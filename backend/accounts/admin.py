from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User

class CustomUserAdmin(BaseUserAdmin, ModelAdmin):
    model = User
    list_display = ('username', 'email', 'class_level', 'is_teacher', 'is_admin', 'total_points')
    list_filter = ('class_level', 'is_teacher', 'is_admin')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('class_level', 'fav_subjects', 'disliked_subjects', 'total_points', 'is_teacher', 'is_admin')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('class_level', 'fav_subjects', 'disliked_subjects', 'total_points', 'is_teacher', 'is_admin')}),
    )

admin.site.register(User, CustomUserAdmin)