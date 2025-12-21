from django.urls import path
from .views import RegisterView, ProfileView, UserListView, StudySessionView, StudyStatsView, WorkOSAuthView, AdminPanelView, UpdateUserProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateUserProfileView.as_view(), name='update-profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('workos-auth/', WorkOSAuthView.as_view(), name='workos-auth'),
    path('admin-panel/', AdminPanelView.as_view(), name='admin-panel'),
    path('admin-panel/<int:user_id>/', AdminPanelView.as_view(), name='admin-user-actions'),
    path('study-sessions/', StudySessionView.as_view(), name='study-sessions'),
    path('study-stats/', StudyStatsView.as_view(), name='study-stats'),
]