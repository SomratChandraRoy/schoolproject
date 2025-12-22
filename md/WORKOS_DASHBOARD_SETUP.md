# WorkOS Dashboard Configuration Guide

## Overview

This guide walks you through configuring Google OAuth in your WorkOS dashboard. This is the **ONLY** remaining step to make Google login work.

## Prerequisites

- WorkOS account (sign up at https://workos.com if you don't have one)
- Google Cloud Console project with OAuth 2.0 credentials
- Your WorkOS credentials (already in `.env` files):
  - API Key: `sk_test_REDACTED`
  - Client ID: `client_REDACTED`

---

## Part 1: Google Cloud Console Setup

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com
2. Sign in with your Google account
3. Create a new project or select an existing one

### Step 2: Enable Required APIs

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**
4. Also enable **"Google Identity"** if available

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (or Internal if using Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: MedhaBangla
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. **Scopes**: Click "Add or Remove Scopes"
   - Add: `userinfo.email`
   - Add: `userinfo.profile`
   - Add: `openid`
7. Click **"Save and Continue"**
8. **Test users** (if in development mode):
   - Add your email address
   - Add any other test users
9. Click **"Save and Continue"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Fill in the details:
   - **Name**: MedhaBangla WorkOS
   - **Authorized JavaScript origins**: (leave empty for now)
   - **Authorized redirect URIs**: 
     ```
     https://api.workos.com/sso/oauth/google/callback
     ```
     **IMPORTANT**: This exact URL is required for WorkOS
5. Click **"Create"**
6. **COPY** the Client ID and Client Secret (you'll need these for WorkOS)

**Example of what you'll see:**
```
Your Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Your Client Secret: GOCSPX-abcdefghijklmnopqrstuvwxyz
```

---

## Part 2: WorkOS Dashboard Setup

### Step 1: Login to WorkOS

1. Go to: https://dashboard.workos.com
2. Sign in with your WorkOS account
3. Select your organization/environment

### Step 2: Navigate to Authentication

1. In the left sidebar, look for **"Authentication"** or **"User Management"**
2. Click on **"Connections"** or **"Configure"**

### Step 3: Add Google OAuth Connection

1. Click **"Add Connection"** or **"New Connection"** button
2. Select **"Google OAuth"** from the list of providers
3. You'll see a form with fields for:
   - **Connection Name**: Enter "Google" or "Google OAuth"
   - **Google Client ID**: Paste the Client ID from Google Cloud Console
   - **Google Client Secret**: Paste the Client Secret from Google Cloud Console

### Step 4: Configure Connection Settings

1. **Redirect URI**: Verify it shows `http://localhost:5173/auth/callback`
   - For production, you'll add your production domain later
2. **Scopes**: Should include:
   - `openid`
   - `email`
   - `profile`
3. **Status**: Make sure it's set to **"Enabled"** or **"Active"**

### Step 5: Save and Test

1. Click **"Save"** or **"Create Connection"**
2. You should see your Google OAuth connection in the list
3. Look for a **"Test"** button and click it to verify the connection works
4. If test is successful, you're done! ✅

---

## Part 3: Verify Configuration

### Visual Checklist

In your WorkOS dashboard, you should see:

```
┌─────────────────────────────────────────────────────┐
│ Connections                                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✓ Google OAuth                          [Enabled]  │
│   Connection ID: conn_xxxxxxxxxxxxx                │
│   Status: Active                                   │
│   Last tested: Just now                            │
│                                                     │
│   [Edit] [Test] [Disable]                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Configuration Summary

Verify these settings are correct:

| Setting | Value |
|---------|-------|
| **Provider** | Google OAuth |
| **Status** | Enabled/Active |
| **Client ID** | (from Google Cloud Console) |
| **Client Secret** | (from Google Cloud Console) |
| **Redirect URI** | `http://localhost:5173/auth/callback` |
| **Scopes** | openid, email, profile |

---

## Part 4: Test the Integration

### Step 1: Run Test Script

```bash
cd backend
python test_workos_setup.py
```

**Expected output:**
```
============================================================
Testing Environment Variables
============================================================
✓ WORKOS_API_KEY: sk_test_a2V5XzAxS0NE...
✓ WORKOS_CLIENT_ID: client_REDACTED
✓ WORKOS_REDIRECT_URI: http://localhost:5173/auth/callback

============================================================
Testing WorkOS SDK Installation
============================================================
✓ WorkOS SDK is installed

============================================================
Testing WorkOS Client Initialization
============================================================
✓ WorkOS client initialized successfully

============================================================
Testing Authorization URL Generation
============================================================
✓ Authorization URL generated successfully

============================================================
Test Summary
============================================================
✓ PASS: Environment Variables
✓ PASS: WorkOS SDK Installation
✓ PASS: WorkOS Client Initialization
✓ PASS: Authorization URL Generation

Results: 4/4 tests passed

🎉 All tests passed! WorkOS is properly configured.
```

### Step 2: Start the Application

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend/medhabangla
npm run dev
```

### Step 3: Test Google Login

1. Open browser: http://localhost:5173/login
2. Click **"Continue with Google"** button
3. You should be redirected to Google login page
4. Sign in with your Google account
5. Grant permissions to the app
6. You should be redirected back to: http://localhost:5173/dashboard
7. You should be logged in! ✅

---

## Troubleshooting

### Issue: "The provider 'Google' is not valid"

**Cause**: Google OAuth connection not configured or disabled in WorkOS

**Solution**:
1. Check WorkOS dashboard → Connections
2. Verify Google OAuth connection exists
3. Verify it's **Enabled/Active**
4. Click **Test** to verify it works

### Issue: "Redirect URI mismatch"

**Cause**: Redirect URI doesn't match in Google Cloud Console or WorkOS

**Solution**:
1. In Google Cloud Console, verify redirect URI is:
   ```
   https://api.workos.com/sso/oauth/google/callback
   ```
2. In WorkOS dashboard, verify redirect URI is:
   ```
   http://localhost:5173/auth/callback
   ```

### Issue: "Invalid client"

**Cause**: Wrong Google Client ID or Secret in WorkOS

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Copy the correct Client ID and Secret
3. Update in WorkOS dashboard → Connections → Google OAuth
4. Save and test again

### Issue: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not properly configured

**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. Verify all required fields are filled
3. Add your email as a test user
4. Publish the app (or keep in testing mode with test users)

### Issue: Test script fails on "Authorization URL Generation"

**Cause**: WorkOS can't generate URL because connection isn't configured

**Solution**:
1. Complete Part 2 of this guide (WorkOS Dashboard Setup)
2. Ensure Google OAuth connection is created and enabled
3. Run test script again

---

## Production Deployment

When deploying to production:

### 1. Update Google Cloud Console

Add production redirect URI:
```
https://api.workos.com/sso/oauth/google/callback
```

Add production JavaScript origins (if needed):
```
https://yourdomain.com
```

### 2. Update WorkOS Dashboard

1. Add production redirect URI:
   ```
   https://yourdomain.com/auth/callback
   ```
2. Update environment variables with production URLs

### 3. Publish OAuth Consent Screen

1. Go to Google Cloud Console → OAuth consent screen
2. Click **"Publish App"**
3. Submit for verification if needed (for production use)

---

## Quick Reference

### Important URLs

| Service | URL |
|---------|-----|
| **WorkOS Dashboard** | https://dashboard.workos.com |
| **Google Cloud Console** | https://console.cloud.google.com |
| **WorkOS Docs** | https://workos.com/docs |
| **Google OAuth Docs** | https://developers.google.com/identity/protocols/oauth2 |

### Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend environment variables |
| `frontend/medhabangla/.env` | Frontend environment variables |
| `backend/test_workos_setup.py` | Test WorkOS configuration |
| `WORKOS_SETUP_GUIDE.md` | Detailed setup guide |
| `QUICK_START_WORKOS.md` | Quick start guide |

### Support

- **WorkOS Support**: support@workos.com
- **WorkOS Docs**: https://workos.com/docs
- **WorkOS Status**: https://status.workos.com

---

## Summary

✅ **What's Done**:
- Backend endpoints implemented
- Frontend components updated
- Error handling enhanced
- Documentation created
- Test script available

⏳ **What You Need to Do**:
1. Configure Google OAuth in Google Cloud Console (10 minutes)
2. Add Google OAuth connection in WorkOS dashboard (5 minutes)
3. Run test script to verify
4. Test Google login in the app

**Total Time**: ~15 minutes

Once you complete these steps, Google OAuth login will work perfectly! 🎉
