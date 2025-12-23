# Testing Guide: Enhanced PDF Viewer with AI Chat

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd S.P-by-Bipul-Roy/backend
python manage.py runserver
```

### 2. Start the Frontend
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla
npm run dev
```

### 3. Access the Application
Open your browser to: `http://localhost:5173`

## 📋 Test Scenarios

### Test 1: Desktop View (Laptop/Desktop)
**Steps:**
1. Login to the application
2. Navigate to Books page (`/books`)
3. Click on any book's "Read Book" button
4. Verify:
   - ✅ PDF loads with proper rendering
   - ✅ Pages are scrollable
   - ✅ AI chat panel is visible on the right (33% width)
   - ✅ PDF viewer takes 66% width
   - ✅ "AI Ready" indicator appears after analysis
   - ✅ Welcome message appears in chat

**Expected Result:**
- Professional PDF viewer with side-by-side layout
- Smooth scrolling through pages
- AI chat ready for questions

### Test 2: AI Chat Functionality
**Steps:**
1. Open any book in the PDF viewer
2. Wait for "AI Ready" indicator
3. Type a question in the chat input (e.g., "What is this book about?")
4. Press Enter or click send button
5. Verify:
   - ✅ User message appears on the right (blue bubble)
   - ✅ Loading animation shows (three bouncing dots)
   - ✅ AI response appears on the left (white bubble)
   - ✅ Response is relevant to the PDF content
   - ✅ Timestamps are shown

**Test Questions:**
- "What is this book about?"
- "Explain the main concepts"
- "Summarize chapter 1"
- "What topics are covered?"

**Expected Result:**
- AI provides accurate answers based on PDF content
- Responses in Bengali and English
- Chat history is maintained

### Test 3: Tablet View (768px - 1024px)
**Steps:**
1. Resize browser window to tablet size (e.g., 800px width)
2. Open a book
3. Verify:
   - ✅ Layout remains side-by-side
   - ✅ PDF viewer: 66% width
   - ✅ Chat panel: 33% width
   - ✅ All buttons are accessible
   - ✅ Text is readable
   - ✅ Touch scrolling works

**Expected Result:**
- Comfortable viewing on tablet devices
- No horizontal scrolling needed
- All features accessible

### Test 4: Mobile View (< 768px)
**Steps:**
1. Resize browser window to mobile size (e.g., 375px width)
2. Open a book
3. Verify:
   - ✅ Layout changes to vertical (stacked)
   - ✅ Chat is hidden by default
   - ✅ PDF takes full width
   - ✅ Toggle button shows icon only (📖/💬)
   - ✅ Clicking toggle shows chat panel
   - ✅ Chat takes bottom 50% when visible
   - ✅ PDF takes top 50% when chat visible

**Expected Result:**
- Optimized mobile experience
- Easy to toggle between reading and chatting
- No layout overflow

### Test 5: Toggle Chat Visibility
**Steps:**
1. Open a book (any screen size)
2. Click "Hide Chat" button
3. Verify:
   - ✅ Chat panel disappears
   - ✅ PDF viewer expands to full width
   - ✅ Button changes to "Show AI Chat"
4. Click "Show AI Chat" button
5. Verify:
   - ✅ Chat panel reappears
   - ✅ Previous messages are still there
   - ✅ Layout adjusts smoothly

**Expected Result:**
- Smooth transitions
- State is preserved
- Responsive to screen size

### Test 6: Dark Mode
**Steps:**
1. Enable dark mode in the application
2. Open a book
3. Verify:
   - ✅ PDF viewer background is dark
   - ✅ Chat panel has dark theme
   - ✅ Messages have proper contrast
   - ✅ Input fields are styled for dark mode
   - ✅ All text is readable

**Expected Result:**
- Complete dark mode support
- Good contrast ratios
- Comfortable for night reading

### Test 7: Error Handling
**Steps:**
1. Test with invalid PDF URL
2. Verify:
   - ✅ Error message shows "Failed to load PDF"
   - ✅ Helpful message displayed
   - ✅ No crash or blank screen

3. Test AI chat without network
4. Verify:
   - ✅ Error message in chat
   - ✅ User can retry
   - ✅ Previous messages preserved

**Expected Result:**
- Graceful error handling
- User-friendly error messages
- No application crashes

### Test 8: Performance
**Steps:**
1. Open a large PDF (50+ pages)
2. Verify:
   - ✅ Initial load is reasonable (< 5 seconds)
   - ✅ Scrolling is smooth
   - ✅ Pages render on-demand
   - ✅ No lag when typing in chat
   - ✅ Memory usage is reasonable

**Expected Result:**
- Good performance even with large PDFs
- Smooth user experience
- Efficient resource usage

### Test 9: Keyboard Navigation
**Steps:**
1. Open a book
2. Click in chat input
3. Type a message
4. Press Enter (without Shift)
5. Verify:
   - ✅ Message is sent
   - ✅ Input is cleared
   - ✅ Focus remains in input

6. Press Shift+Enter
7. Verify:
   - ✅ New line is added
   - ✅ Message is NOT sent

**Expected Result:**
- Intuitive keyboard shortcuts
- Enter sends, Shift+Enter adds line

### Test 10: Multiple Books
**Steps:**
1. Open Book A
2. Ask AI a question about Book A
3. Close viewer
4. Open Book B
5. Ask AI a question about Book B
6. Verify:
   - ✅ AI analyzes Book B correctly
   - ✅ Answers are specific to Book B
   - ✅ No confusion between books

**Expected Result:**
- Each book has separate AI context
- No cross-contamination of content

## 🐛 Common Issues & Solutions

### Issue 1: PDF Not Loading
**Symptoms:** Spinner keeps spinning, no PDF appears
**Solutions:**
- Check if PDF URL is accessible
- Verify CORS settings on backend
- Check browser console for errors
- Ensure embedpdf packages are installed

### Issue 2: AI Not Responding
**Symptoms:** Questions sent but no response
**Solutions:**
- Check backend is running
- Verify Gemini API keys are configured
- Check network tab for API errors
- Ensure PDF was analyzed successfully

### Issue 3: Layout Issues on Mobile
**Symptoms:** Overlapping elements, horizontal scroll
**Solutions:**
- Clear browser cache
- Check viewport meta tag
- Verify Tailwind CSS is loaded
- Test in different mobile browsers

### Issue 4: Dark Mode Not Working
**Symptoms:** Some elements stay light in dark mode
**Solutions:**
- Check dark mode context is working
- Verify all components use dark: classes
- Clear browser cache
- Check CSS specificity issues

## ✅ Success Criteria

The implementation is successful if:
- [x] PDF loads and renders correctly on all devices
- [x] AI chat provides accurate answers
- [x] Layout is responsive (mobile, tablet, desktop)
- [x] Dark mode works completely
- [x] No console errors
- [x] Smooth performance
- [x] Error handling works
- [x] Keyboard navigation works
- [x] Toggle chat works
- [x] Multiple books work independently

## 📊 Browser Compatibility

Test in these browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

## 🎯 Performance Benchmarks

Target metrics:
- Initial load: < 5 seconds
- Page render: < 100ms
- AI response: < 3 seconds
- Smooth scrolling: 60 FPS
- Memory usage: < 200MB

## 📝 Test Report Template

```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Test Results:
- Desktop View: ☐ Pass ☐ Fail
- AI Chat: ☐ Pass ☐ Fail
- Tablet View: ☐ Pass ☐ Fail
- Mobile View: ☐ Pass ☐ Fail
- Toggle Chat: ☐ Pass ☐ Fail
- Dark Mode: ☐ Pass ☐ Fail
- Error Handling: ☐ Pass ☐ Fail
- Performance: ☐ Pass ☐ Fail
- Keyboard Nav: ☐ Pass ☐ Fail
- Multiple Books: ☐ Pass ☐ Fail

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: ☐ Pass ☐ Fail
```

## 🎉 Ready for Production

Once all tests pass, the Enhanced PDF Viewer is ready for production use!
