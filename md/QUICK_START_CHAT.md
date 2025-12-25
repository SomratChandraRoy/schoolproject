# 🚀 Quick Start - Chat System

## Start the Application

### 1. Start Backend
```bash
cd S.P-by-Bipul-Roy/backend
python manage.py runserver
```

### 2. Start Frontend
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla
npm run dev
```

### 3. Open Browser
```
http://localhost:5173
```

---

## Test the Chat System

### Step 1: Create Member Users
1. Login as admin
2. Go to Admin Dashboard
3. Click "Member Management" tab
4. Toggle "Member Status" for 2+ users

### Step 2: Test Chat
1. Logout and login as Member User A
2. Click "💬 Chat" in navbar
3. Search for Member User B
4. Click to start chat
5. Send a message - it appears instantly! ✨

### Step 3: Test Notification Badge
1. Open incognito/another browser
2. Login as Member User B
3. Send message to User A
4. Go back to User A's browser
5. See red badge with count on "💬 Chat" link

### Step 4: Test File Upload
1. In chat, click 📎 (paperclip icon)
2. Select an image/video/document
3. Watch progress bar
4. File appears in chat
5. Click to view/download

---

## Features to Try

### ✨ Instant Messaging
- Type and send - message appears immediately
- No waiting for server response
- Status indicators: ⏱️ → ✓ → ✓✓

### 🔔 Notification Badge
- Shows unread count on navbar
- Updates every 5 seconds
- Red badge with white text
- Animated pop effect

### 📎 File Sharing
- Upload images, videos, documents
- Max 50MB per file
- Progress bar during upload
- Preview in chat

### 💬 Typing Indicator
- See when other person is typing
- Animated bouncing dots
- Disappears after 3 seconds

### 🎨 Beautiful UI
- WhatsApp-like design
- Gradient message bubbles
- Smooth animations
- Dark mode support

---

## Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line
- `Esc` - Close search/modal

---

## API Endpoints

All endpoints require authentication:
```
Authorization: Token YOUR_TOKEN
```

### Chat Endpoints
```
GET  /api/chat/members/                    - List members
GET  /api/chat/chatrooms/                  - List chatrooms
POST /api/chat/chatrooms/get_or_create/    - Create/get chatroom
GET  /api/chat/messages/?chatroom={id}     - Get messages
POST /api/chat/messages/                   - Send message
POST /api/chat/upload-file/                - Upload file
GET  /api/chat/unread-count/               - Get unread count
POST /api/chat/chatrooms/{id}/mark_as_read/ - Mark as read
```

---

## Troubleshooting

### "You need member access to use chat"
**Solution**: Admin must enable member status for your user

### Badge not showing
**Solution**: 
1. Check user has `is_member=True`
2. Logout and login again
3. Check browser console for errors

### File upload failing
**Solution**:
1. Check file size < 50MB
2. Verify backend is running
3. Check `media/` folder permissions

### Messages not appearing
**Solution**:
1. Check internet connection
2. Verify backend is running
3. Check browser console
4. Try refreshing page

---

## Production Checklist

Before deploying to production:

- [ ] Configure MEDIA_ROOT and MEDIA_URL
- [ ] Setup file storage (S3/Google Drive)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Setup Redis for caching
- [ ] Enable database connection pooling
- [ ] Add rate limiting
- [ ] Setup monitoring/logging
- [ ] Configure backup strategy
- [ ] Test on mobile devices
- [ ] Load test with multiple users

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check backend logs
3. Verify all dependencies installed
4. Clear browser cache
5. Try incognito mode

---

**Happy Chatting! 💬✨**
