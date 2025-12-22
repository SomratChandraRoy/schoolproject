from django.urls import path
from .views import RegisterView, ProfileView, UserListView, StudySessionView, StudyStatsView, WorkOSAuthView, WorkOSAuthURLView, AdminPanelView, UpdateUserProfileView, NoteListCreateView, NoteDetailView, NoteSyncView, UserDashboardView, GlobalLeaderboardView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('dashboard/', UserDashboardView.as_view(), name='user-dashboard'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateUserProfileView.as_view(), name='update-profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('leaderboard/', GlobalLeaderboardView.as_view(), name='global-leaderboard'),
    path('workos-auth-url/', WorkOSAuthURLView.as_view(), name='workos-auth-url'),
    path('workos-auth/', WorkOSAuthView.as_view(), name='workos-auth'),
    path('admin-panel/', AdminPanelView.as_view(), name='admin-panel'),
    path('admin-panel/<int:user_id>/', AdminPanelView.as_view(), name='admin-user-actions'),
    path('study-sessions/', StudySessionView.as_view(), name='study-sessions'),
    path('study-stats/', StudyStatsView.as_view(), name='study-stats'),
    path('notes/', NoteListCreateView.as_view(), name='notes-list-create'),
    path('notes/<int:pk>/', NoteDetailView.as_view(), name='notes-detail'),
    path('notes/sync/', NoteSyncView.as_view(), name='notes-sync'),
]