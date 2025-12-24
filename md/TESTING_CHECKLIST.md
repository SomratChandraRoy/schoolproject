# 🧪 Ollama AI Integration - Testing Checklist

Use this checklist to verify all AI sections are working correctly with Ollama.

---

## ✅ Pre-Testing Checklist

- [ ] AWS EC2 instance is running
- [ ] Ollama service is active on EC2
- [ ] Nginx is running on EC2
- [ ] Security Group allows port 80
- [ ] Backend .env file has Ollama credentials
- [ ] Backend server is running (`python manage.py runserver`)
- [ ] Frontend server is running (`npm run dev`)

---

## 🧪 Test 1: Ollama Server Connection

### Command:
```bash
python S.P-by-Bipul-Roy/test-ollama-connection.py
```

### Expected Result:
```
✅ Server is online!
Available models: llama3:latest
✅ Generation successful!
✅ Bangla prompt successful!
✅ Long response successful!
🎉 All tests passed!
```

### Status:
- [ ] PASS
- [ ] FAIL (if fail, check EC2 instance)

---

## 🧪 Test 2: General Chat (AIChat Component)

### Steps:
1. Open http://localhost:5173
2. Click AI chat button (bottom right, blue/purple gradient)
3. Type: "গণিতে ভালো করার জন্য কী করতে হবে?"
4. Press Enter

### Expected Result:
- [ ] Chat window opens
- [ ] Message is sent
- [ ] AI responds in Bangla
- [ ] Response is helpful and educational
- [ ] Footer shows "Powered by Ollama AI (AWS)"

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 3: Homework Help

### Steps:
1. In AI chat, click "হোমওয়ার্ক" tab
2. Type: "2x + 5 = 15 সমাধান করতে হবে"
3. Press Enter

### Expected Result:
- [ ] AI provides step-by-step guidance
- [ ] Does NOT give direct answer
- [ ] Encourages student to think
- [ ] Response is in Bangla

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 4: Exam Preparation

### Steps:
1. In AI chat, click "পরীক্ষা" tab
2. Type: "পরীক্ষার জন্য কীভাবে প্রস্তুতি নিব?"
3. Press Enter

### Expected Result:
- [ ] AI provides exam preparation tips
- [ ] Mentions time management
- [ ] Suggests study strategies
- [ ] Response is encouraging

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 5: Quiz Analysis

### Steps:
1. Go to Quiz section
2. Select a subject (e.g., Mathematics)
3. Complete the quiz (answer some correctly, some incorrectly)
4. Click "Submit Quiz"
5. Wait for analysis

### Expected Result:
- [ ] Loading screen appears
- [ ] Results page shows score
- [ ] AI analysis appears in Bangla
- [ ] Analysis includes:
  - [ ] Performance breakdown
  - [ ] Mistake identification
  - [ ] Improvement suggestions
  - [ ] Next steps

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 6: Learning from Mistakes

### Steps:
1. After completing quiz with mistakes
2. Click "📚 Learn from Mistakes" button
3. Wait for learning plan

### Expected Result:
- [ ] Modal opens
- [ ] Loading indicator appears
- [ ] Learning plan is generated
- [ ] Plan includes:
  - [ ] Explanation of each mistake
  - [ ] Correct concepts
  - [ ] Memory techniques
  - [ ] Practice suggestions
  - [ ] Check-point questions
  - [ ] Encouraging message

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 7: PDF Chat

### Steps:
1. Go to Books section
2. Click on any book
3. PDF viewer opens
4. Click "💬 AI Chat" button
5. Type: "What is this book about?"
6. Press Enter

### Expected Result:
- [ ] Chat panel appears
- [ ] Message is sent
- [ ] AI analyzes PDF content
- [ ] AI responds based on PDF content
- [ ] Response is relevant to the book

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 8: Error Handling

### Test 8.1: Server Offline
1. Stop Ollama server on EC2
2. Try to send a message in AI chat

**Expected:**
- [ ] Error message appears
- [ ] Message is user-friendly
- [ ] Suggests trying again

### Test 8.2: Timeout
1. Send a very long/complex prompt
2. Wait for response

**Expected:**
- [ ] Either responds successfully
- [ ] Or shows timeout error with helpful message

### Status:
- [ ] PASS
- [ ] FAIL

---

## 🧪 Test 9: Performance

### Measure Response Times:

| Test | Expected Time | Actual Time | Status |
|------|---------------|-------------|--------|
| General Chat | 5-15 seconds | _____ sec | [ ] |
| Homework Help | 5-15 seconds | _____ sec | [ ] |
| Quiz Analysis | 10-30 seconds | _____ sec | [ ] |
| Learning Plan | 15-45 seconds | _____ sec | [ ] |
| PDF Chat | 10-30 seconds | _____ sec | [ ] |

**Note:** First request may be slower (model loading)

---

## 🧪 Test 10: Multiple Concurrent Users

### Steps:
1. Open app in 3 different browsers/tabs
2. Send messages simultaneously from all 3
3. Check if all get responses

### Expected Result:
- [ ] All 3 users get responses
- [ ] No errors
- [ ] Responses are correct
- [ ] No significant slowdown

### Status:
- [ ] PASS
- [ ] FAIL

---

## 📊 Overall Test Results

### Summary:
- Total Tests: 10
- Passed: _____ / 10
- Failed: _____ / 10

### Critical Issues:
(List any critical issues found)

1. 
2. 
3. 

### Minor Issues:
(List any minor issues found)

1. 
2. 
3. 

---

## ✅ Sign-Off

### Tested By:
- Name: _____________________
- Date: _____________________
- Time: _____________________

### Status:
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Some tests failed - Needs fixes
- [ ] ❌ Major issues - Not ready

### Notes:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## 🔧 If Tests Fail

### Check These:

1. **EC2 Instance**
   ```bash
   # SSH to EC2
   ssh -i your-key.pem ubuntu@16.171.19.161
   
   # Check Ollama
   sudo systemctl status ollama
   
   # Check Nginx
   sudo systemctl status nginx
   ```

2. **Backend Logs**
   - Check Django console for errors
   - Look for "Ollama" related errors

3. **Frontend Console**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

4. **Test Direct Connection**
   ```bash
   curl -u bipul:Bipul\$Ollama\$Roy\$2026\$ http://16.171.19.161/api/tags
   ```

---

## 📞 Support

If you need help:
1. Check OLLAMA_INTEGRATION_COMPLETE.md
2. Review error logs
3. Test Ollama server directly
4. Check AWS EC2 instance status

---

**Last Updated:** December 23, 2024
