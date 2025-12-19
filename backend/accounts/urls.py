from django.urls import path
from .views import RegisterView, LoginView, ProfileView, UserListView, WorkOSAuthView, AdminPanelView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('users/', UserListView.as_view(), name='users'),
    path('workos-auth/', WorkOSAuthView.as_view(), name='workos-auth'),
    path('admin-panel/', AdminPanelView.as_view(), name='admin-panel'),
    path('admin-panel/<int:user_id>/', AdminPanelView.as_view(), name='admin-user-actions'),
]