# AI Chat Quick Test Guide

## Quick Start (2 minutes)

### 1. Start Services
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend/medhabangla
npm run dev
```

### 2. Open Browser
- Go to: http://localhost:5173
- Login with Google
- Look for floating AI button (bottom right)

### 3. Test Chat
1. **Click AI button** → Chat opens
2. **See welcome message** in Bangla
3. **Try quick prompt**: Click "গণিত সমস্যা সমাধান"
4. **Type message**: "2+2 কত?"
5. **Get response** from AI in Bangla

### 4. Test Features
- **Switch mode**: Click "হোমওয়ার্ক" tab
- **Save chat**: Click download icon
- **Clear chat**: Click trash icon
- **Close chat**: Click X button

## Expected Behavior

### ✅ Working Correctly
- AI button appears bottom right
- Chat opens with gradient header
- Welcome message in Bangla
- Quick prompts visible
- Messages send and receive
- Timestamps show correctly
- Dark mode works
- Animations smooth

### ❌ If Not Working

#### No AI button?
- Check if AIChat component is in App.tsx
- Verify user is logged in

#### Chat not responding?
```bash
# Check backend logs
cd backend
python manage.py runserver
# Look for errors in terminal
```

#### API key error?
```bash
# Verify .env file
cat backend/.env | grep GEMINI
# Should show: GEMINI_API_KEY=AIza_REDACTED
```

#### Session error?
- Clear browser localStorage
- Logout and login again
- Try in incognito mode

## Test Scenarios

### Scenario 1: General Question
```
Mode: সাধারণ
Input: "পদার্থবিজ্ঞান কি?"
Expected: Bangla explanation of physics
```

### Scenario 2: Homework Help
```
Mode: হোমওয়ার্ক
Input: "x² + 5x + 6 = 0 সমাধান করুন"
Expected: Step-by-step guidance (not direct answer)
```

### Scenario 3: Exam Prep
```
Mode: পরীক্ষা প্রস্তুতি
Input: "গণিত পরীক্ষার জন্য টিপস দিন"
Expected: Study tips, time management, exam strategies
```

### Scenario 4: Save to Notes
```
1. Have 3-4 message conversation
2. Click save icon (download)
3. See success message
4. Go to Notes page
5. Verify conversation saved
```

## Quick Verification Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] User logged in
- [ ] AI button visible
- [ ] Chat opens on click
- [ ] Welcome message appears
- [ ] Quick prompts work
- [ ] Messages send successfully
- [ ] AI responds in Bangla
- [ ] Timestamps show
- [ ] Save to notes works
- [ ] Clear chat works
- [ ] Dark mode works

## API Key Verification

```bash
# Quick test in Python
cd backend
python manage.py shell
```

```python
from django.conf import settings
import google.generativeai as genai

# Check key
print(f"API Key: {settings.GEMINI_API_KEY[:20]}...")

# Test AI
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')
response = model.generate_content("Say hello in Bangla")
print(response.text)
```

Expected output:
```
API Key: AIzaSyA1E-WnK_tiHcxR...
নমস্কার! (or similar Bangla greeting)
```

## Common Test Messages

### Bangla
- "গণিত কি?"
- "পদার্থবিজ্ঞান ব্যাখ্যা করুন"
- "ইংরেজি গ্রামার শিখতে চাই"
- "পরীক্ষার জন্য টিপস"

### English
- "What is mathematics?"
- "Explain Newton's laws"
- "Help with English grammar"
- "Study tips for exams"

### Mixed
- "2x + 5 = 15 solve করুন"
- "Physics এর basic concepts"
- "Chemistry periodic table বুঝান"

## Performance Check

### Response Time
- First message: 2-5 seconds (session creation)
- Subsequent messages: 1-3 seconds
- Save to notes: < 1 second

### UI Smoothness
- Animations: 60 FPS
- Scroll: Smooth
- Typing: No lag
- Button clicks: Instant

## Browser Console Check

Open DevTools (F12) → Console

### Should NOT see:
- ❌ API key errors
- ❌ 401 Unauthorized
- ❌ 500 Server errors
- ❌ CORS errors
- ❌ Network failures

### Should see:
- ✅ Successful API calls (200 OK)
- ✅ Session created
- ✅ Messages sent/received

## Network Tab Check

Filter by: `ai`

### Expected Requests:
1. `POST /api/ai/chat/start/` → 201 Created
2. `POST /api/ai/chat/message/` → 200 OK
3. `POST /api/ai/notes/save/` → 201 Created (when saving)

## Final Verification

If all above tests pass:
✅ **AI Chat is working perfectly!**

You can now:
- Ask questions in Bangla or English
- Get homework help
- Prepare for exams
- Save conversations
- Use across all pages

## Support

If issues persist:
1. Check `md/AI_CHAT_IMPLEMENTATION.md` for detailed docs
2. Review backend logs
3. Check browser console
4. Verify API key in .env
5. Ensure migrations are run: `python manage.py migrate`
