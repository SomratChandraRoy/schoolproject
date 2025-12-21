from django.urls import path
from .views import BookListCreateView, BookDetailView, BookmarkView, SyllabusListCreateView, SyllabusDetailView, UserSyllabusView

urlpatterns = [
    path('books/', BookListCreateView.as_view(), name='book-list-create'),
    path('books/<int:pk>/', BookDetailView.as_view(), name='book-detail'),
    path('bookmarks/', BookmarkView.as_view(), name='bookmark-list'),
    path('bookmarks/<int:book_id>/', BookmarkView.as_view(), name='bookmark-detail'),
    path('syllabus/', SyllabusListCreateView.as_view(), name='syllabus-list-create'),
    path('syllabus/<int:pk>/', SyllabusDetailView.as_view(), name='syllabus-detail'),
    path('my-syllabus/', UserSyllabusView.as_view(), name='user-syllabus'),
]