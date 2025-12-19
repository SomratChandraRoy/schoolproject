from django.urls import path
from .views import BookListCreateView, BookDetailView, BookmarkView

urlpatterns = [
    path('books/', BookListCreateView.as_view(), name='book-list-create'),
    path('books/<int:pk>/', BookDetailView.as_view(), name='book-detail'),
    path('bookmarks/', BookmarkView.as_view(), name='bookmark-list'),
    path('bookmarks/<int:book_id>/', BookmarkView.as_view(), name='bookmark-detail'),
]