from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Book, Bookmark
from .serializers import BookSerializer, BookmarkSerializer
from accounts.models import User


class BookListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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
    permission_classes = [permissions.IsAuthenticated]


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