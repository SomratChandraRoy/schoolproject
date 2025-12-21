from django.urls import path
from .views import ProfileView, UserListView, WorkOSAuthView, AdminPanelView, UpdateUserProfileView

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateUserProfileView.as_view(), name='update-profile'),
    path('users/', UserListView.as_view(), name='users'),
    path('workos-auth/', WorkOSAuthView.as_view(), name='workos-auth'),
    path('admin-panel/', AdminPanelView.as_view(), name='admin-panel'),
    path('admin-panel/<int:user_id>/', AdminPanelView.as_view(), name='admin-user-actions'),
]