# WorkOS Google OAuth Setup Guide

This guide will help you configure WorkOS for Google OAuth authentication in the MedhaBangla project.

## Prerequisites

- WorkOS account (sign up at https://workos.com)
- Google Cloud Console project with OAuth 2.0 credentials
- WorkOS API Key and Client ID (already configured in `.env` files)

## Current Configuration

The project is already configured with the following WorkOS credentials:

```
WORKOS_API_KEY=sk_test_REDACTED
WORKOS_CLIENT_ID=client_REDACTED
WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
```

## Step-by-Step Setup

### 1. Configure WorkOS Dashboard

1. **Login to WorkOS Dashboard**
   - Go to https://dashboard.workos.com
   - Login with your WorkOS account

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Select "Configuration" or "Connections"

3. **Set up Google OAuth Connection**
   - Click "Add Connection" or "Configure Provider"
   - Select "Google OAuth" as the provider
   - You'll need to provide:
     - **Google Client ID**: From Google Cloud Console
     - **Google Client Secret**: From Google Cloud Console

4. **Configure Redirect URI**
   - In WorkOS Dashboard, add the redirect URI:
     ```
     http://localhost:5173/auth/callback
     ```
   - For production, add your production domain:
     ```
     https://yourdomain.com/auth/callback
     ```

### 2. Google Cloud Console Setup

If you haven't set up Google OAuth credentials yet:

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Create a new project or select an existing one

2. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     ```
     https://api.workos.com/sso/oauth/google/callback
     ```
   - Copy the Client ID and Client Secret

4. **Configure OAuth Consent Screen**
   - Go to "OAuth consent screen"
   - Fill in the required information
   - Add test users if in development mode

### 3. Link Google Credentials to WorkOS

1. **Return to WorkOS Dashboard**
   - Go to Authentication > Connections
   - Find your Google OAuth connection
   - Enter the Google Client ID and Client Secret
   - Save the configuration

2. **Enable the Connection**
   - Make sure the Google OAuth connection is enabled
   - Test the connection using WorkOS's test feature

### 4. Verify Environment Configuration

Ensure your environment files are correctly configured:

**Backend (.env)**
```env
WORKOS_API_KEY=sk_test_REDACTED
WORKOS_CLIENT_ID=client_REDACTED
WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
```

**Frontend (.env)**
```env
VITE_WORKOS_CLIENT_ID=client_REDACTED
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
```

## How It Works

### Authentication Flow

1. **User clicks "Continue with Google"** on the login page
2. **Frontend requests authorization URL** from backend (`/api/accounts/workos-auth-url/`)
3. **Backend generates WorkOS authorization URL** using WorkOS SDK
4. **User is redirected to WorkOS/Google** for authentication
5. **User authenticates with Google** and grants permissions
6. **Google redirects back to WorkOS** with authorization code
7. **WorkOS redirects to your callback URL** (`http://localhost:5173/auth/callback?code=...`)
8. **Frontend sends code to backend** (`/api/accounts/workos-auth/`)
9. **Backend exchanges code for user profile** using WorkOS SDK
10. **Backend creates/updates user** in database
11. **Backend returns JWT token** to frontend
12. **Frontend stores token** and redirects to dashboard

### API Endpoints

#### 1. Get Authorization URL
```
GET /api/accounts/workos-auth-url/
```

**Response:**
```json
{
  "authorization_url": "https://api.workos.com/user_management/authorize?..."
}
```

#### 2. Authenticate with Code
```
POST /api/accounts/workos-auth/
Content-Type: application/json

{
  "code": "authorization_code_from_workos"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "https://...",
    "class_level": 9,
    "is_student": true
  },
  "is_new_user": true
}
```

## Troubleshooting

### Error: "The provider 'Google' is not valid"

**Cause:** This error occurs when:
- Google OAuth connection is not configured in WorkOS dashboard
- The connection is disabled
- Using incorrect provider parameter

**Solution:**
1. Check WorkOS dashboard to ensure Google OAuth connection exists
2. Verify the connection is enabled
3. Make sure you've entered Google Client ID and Secret
4. The backend now generates the authorization URL correctly

### Error: "connection_strategy_invalid"

**Cause:** This error indicates:
- The authentication strategy is not properly configured
- Missing or incorrect connection setup in WorkOS

**Solution:**
1. Verify Google OAuth connection is properly configured in WorkOS
2. Check that the redirect URI matches exactly
3. Ensure the connection is enabled and active

### Error: "No authorization code found"

**Cause:** The callback URL doesn't contain the authorization code

**Solution:**
1. Check browser console for errors
2. Verify redirect URI matches in WorkOS dashboard
3. Check if WorkOS is returning an error instead of code

### Error: "Failed to authenticate with WorkOS"

**Cause:** Backend couldn't exchange the code for user profile

**Solution:**
1. Check backend logs for detailed error messages
2. Verify WORKOS_API_KEY and WORKOS_CLIENT_ID are correct
3. Ensure WorkOS SDK is installed: `pip install workos`
4. Check network connectivity to WorkOS API

### Testing the Setup

1. **Start the backend server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start the frontend development server:**
   ```bash
   cd frontend/medhabangla
   npm run dev
   ```

3. **Test the login flow:**
   - Navigate to http://localhost:5173/login
   - Click "Continue with Google"
   - You should be redirected to Google login
   - After authentication, you should be redirected back to the dashboard

4. **Check logs:**
   - Backend logs will show WorkOS API calls
   - Frontend console will show authentication progress
   - Look for any error messages

## Common Issues

### Issue: Blank page after clicking Google login

**Solution:**
- Check browser console for JavaScript errors
- Verify backend is running on port 8000
- Check CORS configuration in Django settings

### Issue: Redirect loop

**Solution:**
- Clear browser cookies and localStorage
- Check if token is being stored correctly
- Verify authentication middleware is working

### Issue: User not created in database

**Solution:**
- Check backend logs for database errors
- Verify User model has all required fields
- Run migrations: `python manage.py migrate`

## Production Deployment

When deploying to production:

1. **Update redirect URIs:**
   - In WorkOS dashboard, add production redirect URI
   - Update `.env` files with production URLs

2. **Use production credentials:**
   - Generate production API keys in WorkOS dashboard
   - Update environment variables

3. **Enable HTTPS:**
   - WorkOS requires HTTPS for production
   - Configure SSL certificates

4. **Update CORS settings:**
   - Add production domain to ALLOWED_HOSTS
   - Configure CORS_ALLOWED_ORIGINS

## Support

If you continue to experience issues:

1. Check WorkOS documentation: https://workos.com/docs
2. Review WorkOS dashboard logs
3. Check Django backend logs
4. Review browser console errors
5. Contact WorkOS support if needed

## Security Notes

- Never commit API keys to version control
- Use environment variables for all credentials
- Rotate API keys regularly
- Enable 2FA on WorkOS account
- Monitor authentication logs for suspicious activity
