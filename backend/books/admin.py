from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Book, Bookmark

@admin.register(Book)
class BookAdmin(ModelAdmin):
    list_display = ('title', 'author', 'class_level', 'category', 'language', 'uploaded_at')
    list_filter = ('class_level', 'category', 'language')
    search_fields = ('title', 'author')

@admin.register(Bookmark)
class BookmarkAdmin(ModelAdmin):
    list_display = ('user', 'book', 'page_number', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'book__title')