from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminBookViewSet, AdminBookmarkViewSet, AdminSyllabusViewSet

router = DefaultRouter()
router.register(r'books', AdminBookViewSet, basename='admin-books')
router.register(r'bookmarks', AdminBookmarkViewSet, basename='admin-bookmarks')
router.register(r'syllabus', AdminSyllabusViewSet, basename='admin-syllabus')

urlpatterns = [
    path('', include(router.urls)),
]
