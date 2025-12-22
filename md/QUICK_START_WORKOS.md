# Quick Start - WorkOS Google OAuth

## 🚀 Quick Setup (5 Minutes)

### Step 1: Configure WorkOS Dashboard

1. **Login**: https://dashboard.workos.com
2. **Go to**: Authentication → Connections
3. **Add Google OAuth**:
   - Click "Add Connection"
   - Select "Google OAuth"
   - Enter your Google credentials (see below)
4. **Enable** the connection

### Step 2: Get Google Credentials (if needed)

1. **Go to**: https://console.cloud.google.com
2. **Create OAuth 2.0 Client**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Type: Web application
   - Authorized redirect URI: `https://api.workos.com/sso/oauth/google/callback`
3. **Copy** Client ID and Secret
4. **Paste** into WorkOS dashboard

### Step 3: Test the Setup

```bash
# Test WorkOS configuration
cd backend
python test_workos_setup.py

# If all tests pass, start the servers:

# Terminal 1 - Backend
python manage.py runserver

# Terminal 2 - Frontend
cd ../frontend/medhabangla
npm run dev
```

### Step 4: Try Google Login

1. Open: http://localhost:5173/login
2. Click "Continue with Google"
3. Authenticate with Google
4. Should redirect to dashboard ✅

## 🔧 Troubleshooting

### Error: "The provider 'Google' is not valid"

**Fix**: Configure Google OAuth in WorkOS dashboard (Step 1 above)

### Error: "Failed to generate authorization URL"

**Fix**: 
1. Check WorkOS dashboard configuration
2. Verify Google connection is enabled
3. Run test script: `python test_workos_setup.py`

### Error: "No authorization code found"

**Fix**: 
1. Check redirect URI matches: `http://localhost:5173/auth/callback`
2. Verify in WorkOS dashboard
3. Clear browser cache

## 📚 Detailed Documentation

- **Full Setup Guide**: `WORKOS_SETUP_GUIDE.md`
- **Fix Summary**: `WORKOS_AUTH_FIX_SUMMARY.md`
- **WorkOS Docs**: https://workos.com/docs

## ✅ What's Been Fixed

- ✅ Backend generates authorization URL (more secure)
- ✅ Proper WorkOS SDK usage
- ✅ Enhanced error handling
- ✅ Better user feedback
- ✅ Comprehensive documentation
- ✅ Test script for verification

## 🎯 Current Status

**Backend**: ✅ Ready (all endpoints implemented)
**Frontend**: ✅ Ready (using backend URL generation)
**Documentation**: ✅ Complete
**Testing**: ✅ Test script available

**Next Step**: Configure Google OAuth in WorkOS dashboard (5 minutes)

## 📞 Need Help?

1. Run test script: `python backend/test_workos_setup.py`
2. Check backend logs for errors
3. Review `WORKOS_SETUP_GUIDE.md`
4. Check WorkOS dashboard logs
5. Contact WorkOS support if needed

---

**Note**: The code is ready. You just need to configure the Google OAuth connection in your WorkOS dashboard using your Google Cloud Console credentials.
