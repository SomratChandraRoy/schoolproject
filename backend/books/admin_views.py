from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Book, Bookmark, Syllabus


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class BookSerializer(serializers.ModelSerializer):
    pdf_file = serializers.FileField(required=False)
    cover_image = serializers.ImageField(required=False)
    
    class Meta:
        model = Book
        fields = '__all__'


class BookmarkSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = Bookmark
        fields = '__all__'


class SyllabusSerializer(serializers.ModelSerializer):
    syllabus_pdf = serializers.FileField(required=False)
    syllabus_image = serializers.ImageField(required=False)
    
    class Meta:
        model = Syllabus
        fields = '__all__'


class AdminBookViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for books"""
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Book.objects.all().order_by('-uploaded_at')
        
        # Filter by class
        class_level = self.request.query_params.get('class_level', None)
        if class_level:
            queryset = queryset.filter(class_level=class_level)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by language
        language = self.request.query_params.get('language', None)
        if language:
            queryset = queryset.filter(language=language)
        
        # Search by title or author
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(title__icontains=search) | 
                models.Q(author__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get book statistics"""
        total_books = Book.objects.count()
        by_category = {
            'textbook': Book.objects.filter(category='textbook').count(),
            'story': Book.objects.filter(category='story').count(),
            'poem': Book.objects.filter(category='poem').count(),
            'poetry': Book.objects.filter(category='poetry').count(),
        }
        by_language = {
            'english': Book.objects.filter(language='en').count(),
            'bangla': Book.objects.filter(language='bn').count(),
        }
        
        return Response({
            'total_books': total_books,
            'by_category': by_category,
            'by_language': by_language
        })


class AdminBookmarkViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for bookmarks"""
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Bookmark.objects.all().order_by('-created_at')
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by book
        book_id = self.request.query_params.get('book_id', None)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        
        return queryset


class AdminSyllabusViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for syllabus"""
    queryset = Syllabus.objects.all()
    serializer_class = SyllabusSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Syllabus.objects.all().order_by('class_level', 'subject', 'id')
        
        # Filter by class
        class_level = self.request.query_params.get('class_level', None)
        if class_level:
            queryset = queryset.filter(class_level=class_level)
        
        # Filter by subject
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        
        # Search by chapter title
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(chapter_title__icontains=search)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get syllabus statistics"""
        total_chapters = Syllabus.objects.count()
        by_class = {}
        for i in range(6, 13):
            by_class[f'class_{i}'] = Syllabus.objects.filter(class_level=i).count()
        
        return Response({
            'total_chapters': total_chapters,
            'by_class': by_class
        })
