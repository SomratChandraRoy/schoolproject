# API Endpoint Fix - User Management ✅

## Problem
User management features were not showing in `/superuser` page because the UserManagement component was using incorrect API endpoints.

## Root Cause
The UserManagement component was trying to fetch from:
- ❌ `/api/admin/users/`
- ❌ `/api/admin/users/{id}/ban_user/`
- ❌ `/api/admin/users/{id}/unban_user/`
- ❌ `/api/admin/users/{id}/change_role/`

But the actual endpoints are:
- ✅ `/api/superuser/accounts/users/`
- ✅ `/api/superuser/accounts/users/{id}/ban_user/`
- ✅ `/api/superuser/accounts/users/{id}/unban_user/`
- ✅ `/api/superuser/accounts/users/{id}/change_role/`

## Solution
Updated all API endpoints in `UserManagement.tsx` to use the correct paths.

## Changes Made

### File: `S.P-by-Bipul-Roy/frontend/medhabangla/src/components/admin/UserManagement.tsx`

**1. fetchUsers function**
```typescript
// Before
const url = roleFilter === 'all'
    ? '/api/admin/users/'
    : `/api/admin/users/?role=${roleFilter}`;

// After
const url = roleFilter === 'all'
    ? '/api/superuser/accounts/users/'
    : `/api/superuser/accounts/users/?role=${roleFilter}`;
```

**2. handleBanUser function**
```typescript
// Before
const response = await fetch(`/api/admin/users/${selectedUser.id}/ban_user/`, {

// After
const response = await fetch(`/api/superuser/accounts/users/${selectedUser.id}/ban_user/`, {
```

**3. handleUnbanUser function**
```typescript
// Before
const response = await fetch(`/api/admin/users/${user.id}/unban_user/`, {

// After
const response = await fetch(`/api/superuser/accounts/users/${user.id}/unban_user/`, {
```

**4. handleChangeRole function**
```typescript
// Before
const response = await fetch(`/api/admin/users/${selectedUser.id}/change_role/`, {

// After
const response = await fetch(`/api/superuser/accounts/users/${selectedUser.id}/change_role/`, {
```

## Backend URL Configuration

From `backend/medhabangla/urls.py`:
```python
urlpatterns = [
    # ...
    path('api/superuser/accounts/', include('accounts.admin_urls')),
    path('api/superuser/quizzes/', include('quizzes.admin_urls')),
    path('api/superuser/books/', include('books.admin_urls')),
    # ...
]
```

From `backend/accounts/admin_urls.py`:
```python
router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
# This creates endpoints at: /api/superuser/accounts/users/
```

## Testing

### How to Test
1. Login as admin user
2. Navigate to `/superuser`
3. Click on "Users" tab (👥)
4. You should now see:
   - List of all users
   - Search bar
   - Role filter dropdown
   - Ban/Unban buttons
   - Role change buttons

### Expected Behavior
- ✅ Users list loads successfully
- ✅ Search works
- ✅ Filter by role works
- ✅ Ban button opens modal
- ✅ Unban button works
- ✅ Role change button opens modal
- ✅ All actions update the list

### If Still Not Working
1. **Check browser console** for errors
2. **Check network tab** to see if API calls are being made
3. **Verify token** is present in localStorage
4. **Check backend logs** for any errors
5. **Verify admin permissions** - user must have `is_admin=True`

## API Endpoints Summary

All user management endpoints:

```
GET    /api/superuser/accounts/users/                    # List all users
GET    /api/superuser/accounts/users/?role=student       # Filter by role
GET    /api/superuser/accounts/users/?search=john        # Search users
GET    /api/superuser/accounts/users/stats/              # Get statistics
POST   /api/superuser/accounts/users/{id}/ban_user/      # Ban a user
POST   /api/superuser/accounts/users/{id}/unban_user/    # Unban a user
POST   /api/superuser/accounts/users/{id}/change_role/   # Change user role
GET    /api/superuser/accounts/users/{id}/                # Get user details
PUT    /api/superuser/accounts/users/{id}/                # Update user
DELETE /api/superuser/accounts/users/{id}/                # Delete user
```

## Verification Steps

1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Navigate to** `/superuser` and click Users tab
4. **Look for request to** `/api/superuser/accounts/users/`
5. **Check response** - should return array of users

### Expected Response Format
```json
[
    {
        "id": 1,
        "username": "john",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "is_student": true,
        "is_teacher": false,
        "is_admin": false,
        "is_banned": false,
        "ban_reason": null,
        "total_points": 100,
        "date_joined": "2024-01-01T00:00:00Z"
    },
    // ... more users
]
```

## Troubleshooting

### Issue: 404 Not Found
**Cause**: Endpoint doesn't exist
**Solution**: Verify backend URLs are configured correctly

### Issue: 403 Forbidden
**Cause**: User doesn't have admin permissions
**Solution**: Check `is_admin` field in user model

### Issue: 401 Unauthorized
**Cause**: Token is missing or invalid
**Solution**: Check localStorage for 'token', try logging in again

### Issue: Empty list
**Cause**: No users in database or filter is too restrictive
**Solution**: Check database, try "All Users" filter

### Issue: Network Error
**Cause**: Backend not running or CORS issue
**Solution**: Start backend server, check CORS settings

## Conclusion

The API endpoints have been corrected. The UserManagement component now uses the proper `/api/superuser/accounts/users/` endpoints that match the backend URL configuration. All ban and role management features should now work correctly in the `/superuser` page.
