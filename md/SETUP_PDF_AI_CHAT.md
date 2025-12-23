# Quick Setup Guide - Enhanced PDF Viewer with AI Chat

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Backend Dependencies
```bash
cd backend
pip install PyPDF2>=3.0.0
```

### Step 2: No Frontend Changes Needed
The frontend uses iframe for embedpdf.com - no additional packages required!

### Step 3: Test the Feature
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm start`
3. Login and go to Books page
4. Click "Read Now" on any book
5. ✅ PDF opens with AI chat panel!

---

## 📋 What You Get

### embedpdf.com PDF Viewer
- Professional PDF viewing
- Built-in navigation
- Zoom and scroll
- Full-screen support

### AI Chat Assistant
- Analyzes entire PDF automatically
- Answers questions about content
- Bilingual (Bengali + English)
- Real-time responses

---

## 🎯 How It Works

### 1. User Opens Book
```
Click "Read Now"
    ↓
PDF loads in embedpdf.com viewer
    ↓
AI analyzes PDF content (2-10 seconds)
    ↓
Shows "AI Ready" status
    ↓
User can start asking questions
```

### 2. User Asks Question
```
Type question in chat
    ↓
AI retrieves PDF content from cache
    ↓
Sends to Gemini AI with context
    ↓
AI responds with answer
    ↓
Answer appears in chat
```

---

## 🔧 API Endpoints

### Analyze PDF
```
POST /api/ai/analyze-pdf/
Body: {
  "pdf_url": "http://...",
  "book_id": 123,
  "file_name": "Book.pdf"
}
```

### Chat with PDF
```
POST /api/ai/chat-with-pdf/
Body: {
  "question": "What is...?",
  "pdf_url": "http://...",
  "book_id": 123,
  "file_name": "Book.pdf"
}
```

---

## 🧪 Quick Test

### Test 1: Open Book
1. Go to `/books`
2. Click "Read Now" on any book
3. ✅ PDF should load
4. ✅ Should see "Analyzing PDF..." then "AI Ready"

### Test 2: Ask Question
1. Type: "What is this book about?"
2. Click send
3. ✅ Should get AI response

### Test 3: Toggle Chat
1. Click "Hide Chat" button
2. ✅ PDF expands to full width
3. Click "Show AI Chat"
4. ✅ Chat reappears

---

## 📊 Features

### PDF Viewer (embedpdf.com)
- ✅ Professional interface
- ✅ Navigation controls
- ✅ Zoom functionality
- ✅ Scroll support
- ✅ Full-screen mode

### AI Chat
- ✅ Auto-analyzes PDF
- ✅ Context-aware answers
- ✅ Bilingual support
- ✅ Real-time chat
- ✅ Message history

### UI/UX
- ✅ Split view (PDF + Chat)
- ✅ Toggle chat panel
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

---

## 🐛 Common Issues

### PDF not loading?
- Check if PDF URL is accessible
- Verify internet connection
- Check browser console

### AI not responding?
- Check if PDF was analyzed
- Verify Gemini API keys
- Check backend logs

### Chat not showing?
- Click "Show AI Chat" button
- Refresh page
- Check browser console

---

## 💡 Usage Tips

### For Students
- Ask specific questions about concepts
- Request summaries of chapters
- Ask for explanations in simple terms
- Request page references

### Example Questions
- "What is the main topic of chapter 3?"
- "Explain Newton's first law"
- "Summarize page 45"
- "What are the key points?"
- "Give me an example of..."

---

## 📝 Files Modified

### Backend
- `ai/pdf_chat_views.py` (NEW)
- `ai/urls.py` (MODIFIED)
- `requirements.txt` (MODIFIED)

### Frontend
- `components/EnhancedPDFViewer.tsx` (NEW)
- `pages/Books.tsx` (MODIFIED)

---

## ✅ Checklist

- [ ] PyPDF2 installed
- [ ] Backend running
- [ ] Frontend running
- [ ] Can open books
- [ ] PDF loads in viewer
- [ ] AI analyzes PDF
- [ ] Can ask questions
- [ ] AI responds correctly
- [ ] Toggle chat works

---

## 🎉 Success!

If all tests pass, you now have:
- ✅ Professional PDF viewer (embedpdf.com)
- ✅ AI chat assistant
- ✅ Interactive learning experience

**Status:** Ready to use!

---

**Setup Time:** 5 minutes  
**Difficulty:** Easy  
**Requirements:** PyPDF2 only
