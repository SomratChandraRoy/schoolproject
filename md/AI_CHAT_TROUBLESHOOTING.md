# AI Chat Troubleshooting Guide

## Current Issue: API Key Expired

### Error Message
```
দুঃখিত, একটি সমস্যা হয়েছে। AI chat error: 400 API key expired. Please renew the API key.
```

### Backend Error
```
Internal Server Error: /api/ai/chat/message/
[22/Dec/2025 11:09:02] "POST /api/ai/chat/message/ HTTP/1.1" 500 294
```

## Solution Steps

### Step 1: Test Current API Key
```bash
cd backend
python test_gemini_api.py
```

This will tell you if the API key is working or not.

### Step 2: Get New API Key (If Needed)

#### Option A: Use Original Key from promt.md
The original key is: `AIza_REDACTED`

This is already updated in `.env` file.

#### Option B: Create New API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Or: https://aistudio.google.com/app/apikey
3. Click "Create API Key"
4. Select your Google Cloud project (or create new)
5. Copy the new API key

### Step 3: Update .env File
```bash
cd backend
nano .env  # or use any text editor
```

Update this line:
```env
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
```

### Step 4: Restart Backend Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
python manage.py runserver
```

### Step 5: Test Again
1. Open browser: http://localhost:5173
2. Click AI chat button
3. Send a test message: "Hello"
4. Should get response

## Common Issues & Solutions

### Issue 1: "API key expired"
**Cause**: The API key has expired or been revoked

**Solution**:
1. Get new API key from Google AI Studio
2. Update `.env` file
3. Restart server

### Issue 2: "API key invalid"
**Cause**: Wrong API key format or typo

**Solution**:
1. Check `.env` file for typos
2. Ensure no extra spaces or quotes
3. Format should be: `GEMINI_API_KEY=AIzaSy...`

### Issue 3: "Quota exceeded"
**Cause**: Too many API requests

**Solution**:
1. Wait for quota to reset (usually 1 minute)
2. Or create new API key
3. Or upgrade to paid plan

### Issue 4: "Permission denied"
**Cause**: API key doesn't have Gemini API enabled

**Solution**:
1. Go to Google Cloud Console
2. Enable "Generative Language API"
3. Or create new API key with correct permissions

### Issue 5: "Internal Server Error 500"
**Cause**: Backend error (API key, database, etc.)

**Solution**:
1. Check backend terminal for detailed error
2. Run test script: `python test_gemini_api.py`
3. Check database migrations: `python manage.py migrate`
4. Verify `.env` file is loaded

## Verification Checklist

### Backend Verification
```bash
cd backend

# 1. Check .env file exists
ls -la .env

# 2. Check API key is set
cat .env | grep GEMINI_API_KEY

# 3. Test API key
python test_gemini_api.py

# 4. Check Django can load it
python manage.py shell
>>> from django.conf import settings
>>> print(settings.GEMINI_API_KEY)
>>> exit()

# 5. Start server
python manage.py runserver
```

### Frontend Verification
```bash
cd frontend/medhabangla

# 1. Check if running
# Should see: Local: http://localhost:5173

# 2. Open browser console (F12)
# Should NOT see CORS or network errors

# 3. Test AI chat
# Click AI button → Send message → Get response
```

## API Key Requirements

### Valid API Key Format
```
AIzaSy[A-Za-z0-9_-]{33}
```

Example: `AIza_REDACTED`

### Required Permissions
- Generative Language API enabled
- No IP restrictions (or localhost allowed)
- No referrer restrictions (or localhost allowed)

### Free Tier Limits
- 60 requests per minute
- 1,500 requests per day
- Rate limit: 1 request per second

## Testing Different API Keys

### Test Key 1 (Original from promt.md)
```env
GEMINI_API_KEY=AIza_REDACTED
```

### Test Key 2 (Previously used)
```env
GEMINI_API_KEY=AIza_REDACTED
```

### Create Your Own Key
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and paste in `.env`

## Debug Mode

### Enable Detailed Logging
Edit `backend/medhabangla/settings.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### Check Logs
```bash
# Backend logs
cd backend
python manage.py runserver
# Watch terminal for errors

# Frontend logs
# Open browser console (F12)
# Check Console and Network tabs
```

## Alternative: Use Mock AI (For Testing)

If API key issues persist, temporarily use mock responses:

Edit `backend/ai/views.py`:

```python
# Add at top of AIChatMessageView.post()
if settings.DEBUG and not settings.GEMINI_API_KEY:
    # Mock response for testing
    ai_response = "This is a mock AI response. Please configure GEMINI_API_KEY for real AI responses."
    
    ai_message = AIChatMessage.objects.create(
        session=session,
        message=ai_response,
        is_user_message=False,
        message_type=message_type
    )
    
    return Response({
        'user_message': AIChatMessageSerializer(user_message).data,
        'ai_message': ai_response
    })
```

## Quick Fix Commands

### Reset Everything
```bash
# Backend
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
python test_gemini_api.py
python manage.py runserver

# Frontend (in new terminal)
cd frontend/medhabangla
npm run dev
```

### Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or: Ctrl+Shift+Delete → Clear cache

### Reset localStorage
```javascript
// In browser console
localStorage.clear()
location.reload()
```

## Contact Support

If issues persist after trying all solutions:

1. **Check API Key Status**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Verify key is active and not restricted

2. **Check Quota**
   - Visit: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - Ensure you haven't exceeded limits

3. **Create New Project**
   - Sometimes creating a new Google Cloud project helps
   - Create new API key in new project

## Success Indicators

### ✅ Working Correctly
- Test script shows: "✅ SUCCESS: Gemini API is working correctly!"
- Backend logs show: "POST /api/ai/chat/message/ HTTP/1.1" 200
- Frontend shows AI responses
- No errors in browser console

### ❌ Still Not Working
- Test script shows errors
- Backend shows 500 errors
- Frontend shows error messages
- Check all steps above again

## Current Configuration

### File: `backend/.env`
```env
GEMINI_API_KEY=AIza_REDACTED
```

### File: `backend/ai/views.py`
- Enhanced error handling added
- Specific error messages for API key issues
- Better logging for debugging

### File: `backend/test_gemini_api.py`
- New test script created
- Run before starting server
- Validates API key is working

## Next Steps

1. **Run test script**: `python backend/test_gemini_api.py`
2. **If test passes**: Restart server and test chat
3. **If test fails**: Get new API key and update `.env`
4. **Verify**: Send test message in AI chat

The API key has been updated to the original one from `promt.md`. Please restart your backend server and test again.
