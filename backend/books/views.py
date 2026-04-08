from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Book, Bookmark, Syllabus
from .serializers import BookSerializer, BookmarkSerializer, SyllabusSerializer
from accounts.models import User


class ReadOnlyOrAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class BookListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [ReadOnlyOrAuthenticated]
    
    def get_queryset(self):
        queryset = Book.objects.all()
        class_level = self.request.query_params.get('class_level', None)
        category = self.request.query_params.get('category', None)
        language = self.request.query_params.get('language', None)
        
        if class_level:
            queryset = queryset.filter(class_level=class_level)
        if category:
            queryset = queryset.filter(category=category)
        if language:
            queryset = queryset.filter(language=language)
            
        return queryset


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [ReadOnlyOrAuthenticated]


class BookmarkView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        book_id = request.data.get('book_id')
        page_number = request.data.get('page_number')
        
        book = get_object_or_404(Book, id=book_id)
        
        bookmark, created = Bookmark.objects.update_or_create(
            user=user,
            book=book,
            defaults={'page_number': page_number}
        )
        
        serializer = BookmarkSerializer(bookmark)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def get(self, request):
        user = request.user
        bookmarks = Bookmark.objects.filter(user=user)
        serializer = BookmarkSerializer(bookmarks, many=True)
        return Response(serializer.data)
    
    def delete(self, request, book_id):
        user = request.user
        bookmark = get_object_or_404(Bookmark, user=user, book_id=book_id)
        bookmark.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SyllabusListCreateView(generics.ListCreateAPIView):
    serializer_class = SyllabusSerializer
    permission_classes = [ReadOnlyOrAuthenticated]
    
    def get_queryset(self):
        queryset = Syllabus.objects.all()
        class_level = self.request.query_params.get('class_level', None)
        subject = self.request.query_params.get('subject', None)
        
        if class_level:
            queryset = queryset.filter(class_level=class_level)
        if subject:
            queryset = queryset.filter(subject=subject)
            
        return queryset


class SyllabusDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Syllabus.objects.all()
    serializer_class = SyllabusSerializer
    permission_classes = [ReadOnlyOrAuthenticated]
    
    
# View for getting syllabus for a specific user's class level
class UserSyllabusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.class_level:
            return Response({'error': 'User class level not set'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get syllabus for user's class level
        syllabus = Syllabus.objects.filter(class_level=user.class_level)
        serializer = SyllabusSerializer(syllabus, many=True)
        return Response(serializer.data)