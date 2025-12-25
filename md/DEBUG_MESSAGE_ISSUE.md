# 🐛 Debug: Message Not Appearing Issue

## Symptoms

- ⚠️ Warning sign appears on message
- Sender sees "sent" status
- Receiver doesn't see the message

---

## Debugging Steps

### Step 1: Check Browser Console (Sender)

**Open Developer Tools** (F12) and look for:

```javascript
// Success message
Message sent successfully: {id: 123, content: "Hello", ...}

// OR Error message
Failed to send message: 400 {error: "..."}
Network error: Could not send message
```

**What to look for:**
- ✅ "Message sent successfully" = Backend received it
- ❌ "Failed to send" = Backend rejected it
- ❌ "Network error" = Can't reach backend

---

### Step 2: Check Backend Logs

Look for these lines in your Django terminal:

```bash
# Success
HTTP POST /api/chat/messages/ 201 [0.50, 127.0.0.1:12345]

# Error
HTTP POST /api/chat/messages/ 400 [0.50, 127.0.0.1:12345]
HTTP POST /api/chat/messages/ 500 [0.50, 127.0.0.1:12345]
```

**Status Codes:**
- `201` = Success ✅
- `400` = Bad request (validation error)
- `403` = Permission denied
- `500` = Server error

---

### Step 3: Check Database

**If using SQLite:**
```bash
cd backend
python manage.py shell
```

```python
from chat.models import Message
# Check if message was saved
messages = Message.objects.all().order_by('-created_at')[:5]
for msg in messages:
    print(f"ID: {msg.id}, From: {msg.sender.username}, Content: {msg.content}")
```

**If using PostgreSQL:**
```sql
SELECT id, sender_id, content, created_at 
FROM chat_message 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### Step 4: Check Receiver's Browser

**In receiver's browser console:**

```javascript
// Check if polling is working
// Should see requests every 5 seconds
GET /api/chat/messages/?chatroom=1 200

// Check current messages
console.log('Current messages:', messages);
```

---

## Common Issues & Solutions

### Issue 1: Message Saved but Not Appearing

**Symptoms:**
- Backend shows `201` success
- Message in database
- Receiver doesn't see it

**Cause:** Polling not working or wrong chatroom

**Solution:**
```javascript
// In receiver's browser console
// Force reload messages
location.reload();
```

---

### Issue 2: Permission Denied (403)

**Symptoms:**
- Backend shows `403` error
- Console: "Permission denied"

**Cause:** User not participant in chatroom

**Solution:**
Check if both users are members:
```python
# In Django shell
from accounts.models import User
user1 = User.objects.get(username='user1')
user2 = User.objects.get(username='user2')
print(f"User1 is_member: {user1.is_member}")
print(f"User2 is_member: {user2.is_member}")
```

---

### Issue 3: Validation Error (400)

**Symptoms:**
- Backend shows `400` error
- Console: "Failed to send message"

**Cause:** Missing required fields

**Solution:**
Check request payload in Network tab:
```json
{
  "chatroom": 1,
  "message_type": "text",
  "content": "Hello"
}
```

---

### Issue 4: Database Connection Error

**Symptoms:**
- Backend shows connection error
- Very slow response times

**Cause:** Database connection issues

**Solution:**
```bash
# Switch to SQLite temporarily
# In backend/.env
USE_SQLITE=True

# Restart Django
python manage.py migrate
python manage.py runserver
```

---

### Issue 5: Receiver Not Polling

**Symptoms:**
- No polling requests in receiver's Network tab
- Messages never appear

**Cause:** Chat page not active or JavaScript error

**Solution:**
1. Check receiver's console for errors
2. Refresh receiver's page
3. Make sure chat room is selected

---

## Quick Test Script

**Run this in sender's browser console:**

```javascript
// Test sending message
const token = localStorage.getItem('token');
const chatroomId = 1; // Change to your chatroom ID

fetch('/api/chat/messages/', {
    method: 'POST',
    headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        chatroom: chatroomId,
        message_type: 'text',
        content: 'Test message from console'
    })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

**Expected output:**
```javascript
Success: {
  id: 123,
  sender: {...},
  content: "Test message from console",
  created_at: "2024-12-25T...",
  ...
}
```

---

## Checklist

Before reporting the issue, verify:

- [ ] Backend is running (`python manage.py runserver`)
- [ ] Frontend is running (`npm run dev`)
- [ ] Both users are logged in
- [ ] Both users have `is_member=True`
- [ ] Chatroom exists between the two users
- [ ] Browser console shows no errors
- [ ] Backend logs show `201` success
- [ ] Database contains the message
- [ ] Receiver's page is polling (check Network tab)

---

## Advanced Debugging

### Enable Verbose Logging

**In `backend/medhabangla/settings.py`:**

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
        'chat': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

### Monitor Network Requests

**In browser DevTools → Network tab:**

1. Filter by "XHR"
2. Watch for:
   - `POST /api/chat/messages/` (sending)
   - `GET /api/chat/messages/?chatroom=1` (polling)
3. Check response status and data

---

## Report Template

If issue persists, provide this information:

```
**Sender:**
- Browser console output: [paste here]
- Network tab screenshot: [attach]

**Receiver:**
- Browser console output: [paste here]
- Network tab screenshot: [attach]

**Backend:**
- Django logs: [paste last 20 lines]
- Database check: [paste query results]

**Environment:**
- Database: SQLite / PostgreSQL
- Django version: [check]
- Browser: Chrome / Firefox / etc.
```

---

## Quick Fixes to Try

### Fix 1: Hard Refresh Both Browsers
```
Sender: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
Receiver: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
```

### Fix 2: Clear LocalStorage
```javascript
// In both browsers console
localStorage.clear();
// Then login again
```

### Fix 3: Restart Everything
```bash
# Stop Django (Ctrl+C)
# Stop Frontend (Ctrl+C)

# Start Django
cd backend
python manage.py runserver

# Start Frontend (new terminal)
cd frontend/medhabangla
npm run dev
```

### Fix 4: Check Chatroom ID
```javascript
// In sender's console
console.log('Selected room:', selectedRoom);
// Should show: {id: 1, participant1: {...}, participant2: {...}}

// In receiver's console
console.log('Selected room:', selectedRoom);
// Should show same chatroom ID
```

---

## Success Indicators

When working correctly, you should see:

**Sender's Console:**
```
Message sent successfully: {id: 123, ...}
```

**Backend Logs:**
```
HTTP POST /api/chat/messages/ 201 [0.50, 127.0.0.1:12345]
```

**Receiver's Console:**
```
// Every 5 seconds
GET /api/chat/messages/?chatroom=1 200
```

**Receiver's Screen:**
- Message appears within 5 seconds
- Desktop notification shown

---

**Debug Date**: December 25, 2024  
**Status**: Debugging Guide Ready
