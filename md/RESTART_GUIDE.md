# Quick Restart Guide - Fix AI Chat Error

## The Problem
AI Chat was showing: "API key expired" error

## The Solution
Updated API key to original one from `promt.md`

## Steps to Fix (2 minutes)

### 1. Stop Current Server
In your backend terminal, press: **Ctrl + C**

### 2. Test API Key (Optional but Recommended)
```bash
cd backend
python test_gemini_api.py
```

Expected output:
```
✓ API Key found: AIzaSyCMA4rpapVz5S...
✓ Gemini configured successfully
✓ Model created successfully
✓ API Response received: ...
✅ SUCCESS: Gemini API is working correctly!
```

### 3. Restart Backend
```bash
python manage.py runserver
```

### 4. Test AI Chat
1. Open browser: http://localhost:5173
2. Login if needed
3. Click AI chat button (bottom right)
4. Send message: "Hello"
5. Should get AI response in Bangla

## What Was Changed

### File: `backend/.env`
```diff
- GEMINI_API_KEY=AIza_REDACTED
+ GEMINI_API_KEY=AIza_REDACTED
```

### File: `backend/ai/views.py`
- Added better error handling
- Added specific error messages for API issues
- Added logging for debugging

### New Files Created
- `backend/test_gemini_api.py` - Test script for API key
- `md/AI_CHAT_TROUBLESHOOTING.md` - Detailed troubleshooting guide

## Verification

### Backend Terminal Should Show:
```
Watching for file changes with StatReloader
Performing system checks...
System check identified no issues (0 silenced).
December 22, 2025 - 11:30:00
Django version 6.0, using settings 'medhabangla.settings'
Starting development server at http://127.0.0.1:8000/
```

### When You Send AI Message:
```
[22/Dec/2025 11:30:15] "POST /api/ai/chat/start/" 201 155
[22/Dec/2025 11:30:16] "POST /api/ai/chat/message/" 200 450
```

### Browser Should Show:
- AI response in Bangla
- No error messages
- Smooth chat experience

## If Still Not Working

### Option 1: Create New API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Update `backend/.env`:
   ```env
   GEMINI_API_KEY=YOUR_NEW_KEY_HERE
   ```
5. Restart server

### Option 2: Check Quota
The free tier has limits:
- 60 requests per minute
- 1,500 requests per day

If exceeded, wait or create new key.

### Option 3: Check Detailed Logs
```bash
cd backend
python manage.py runserver
# Watch for any error messages
```

## Quick Test Commands

### Test 1: API Key Exists
```bash
cat backend/.env | grep GEMINI_API_KEY
```
Should show: `GEMINI_API_KEY=AIza_REDACTED`

### Test 2: Django Can Load It
```bash
cd backend
python manage.py shell
```
```python
from django.conf import settings
print(settings.GEMINI_API_KEY)
# Should print: AIza_REDACTED
exit()
```

### Test 3: API Works
```bash
python test_gemini_api.py
```
Should show success message.

### Test 4: Chat Works
1. Open: http://localhost:5173
2. Click AI button
3. Type: "নমস্কার"
4. Get response

## Summary

**What to do now:**
1. Stop backend server (Ctrl+C)
2. Run: `python test_gemini_api.py` (optional)
3. Run: `python manage.py runserver`
4. Test AI chat in browser

**Expected result:**
✅ AI chat works perfectly with Bangla responses

**If issues persist:**
📖 Read: `md/AI_CHAT_TROUBLESHOOTING.md`
