from django.contrib import admin
from .models import Book, Bookmark

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'class_level', 'category', 'language', 'uploaded_at')
    list_filter = ('class_level', 'category', 'language')
    search_fields = ('title', 'author')

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'page_number', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'book__title')