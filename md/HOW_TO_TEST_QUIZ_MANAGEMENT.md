# How to Test Quiz Management Page - Quick Guide

## 🚀 Quick Start

1. **Open the page**: Navigate to `/quiz/manage`
2. **Open Browser Console**: Press F12 (you'll see helpful debug messages)
3. **Follow the tests below**

---

## ✅ Test 1: Create MCQ Question (2 minutes)

1. Click **"+ Create Quiz"** button
2. Fill the form:
   - Subject: Select "Mathematics"
   - Class: Select "9"
   - Difficulty: Select "Medium"
   - Question Type: Select "MCQ"
   - Question Text: "What is 2 + 2?"
   - Option A: "3"
   - Option B: "4"
   - Option C: "5"
   - Option D: "6"
   - Correct Answer: "B) 4"
   - Explanation: "2 + 2 equals 4"
3. Click **"Create Question"**

**Expected Results**:
- ✅ Alert: "Quiz question created successfully!"
- ✅ Modal closes
- ✅ New question appears at the top of the list
- ✅ Console shows: "Quiz created successfully:"

---

## ✅ Test 2: Create Short Answer Question (1 minute)

1. Click **"+ Create Quiz"**
2. Fill the form:
   - Subject: Select "Physics"
   - Class: Select "10"
   - Difficulty: Select "Easy"
   - Question Type: Select **"Short Answer"**
   - Question Text: "What is Newton's first law?"
   - Correct Answer: "An object at rest stays at rest unless acted upon by a force"
   - Explanation: "This is the law of inertia"
3. Click **"Create Question"**

**Expected Results**:
- ✅ Options A, B, C, D fields should NOT be visible
- ✅ Question created successfully
- ✅ Appears in list with "short" badge

---

## ✅ Test 3: Filter by Subject (30 seconds)

1. Look at the **Filters** section
2. Click the **Subject** dropdown
3. Select **"Mathematics"**

**Expected Results**:
- ✅ Only Mathematics questions are shown
- ✅ Count updates (e.g., "Showing 1 of 2 questions")
- ✅ Console shows: No errors

4. Select **"All Subjects"**

**Expected Results**:
- ✅ All questions are shown again
- ✅ Count shows total (e.g., "Showing 2 of 2 questions")

---

## ✅ Test 4: Edit Question (1 minute)

1. Find any question in the list
2. Click **"Edit"** button
3. **Check**: All fields should be pre-filled
4. Change something (e.g., change difficulty from "Medium" to "Hard")
5. Click **"Update Question"**

**Expected Results**:
- ✅ Alert: "Quiz question updated successfully!"
- ✅ Modal closes
- ✅ Changes are visible in the list
- ✅ Console shows: "Quiz updated successfully:"

---

## ✅ Test 5: AI Generation (1 minute)

1. Click **"✨ Generate with AI"** button
2. Select parameters:
   - Subject: "Chemistry"
   - Class: "9"
   - Difficulty: "Medium"
   - Question Type: "MCQ"
3. Click **"Generate"**

**Expected Results**:
- ✅ Button shows "Generating..."
- ✅ Wait 3-10 seconds
- ✅ Alert: "AI question generated and saved successfully!"
- ✅ Modal closes
- ✅ New Chemistry question appears in list
- ✅ Console shows: "AI generated question:"

---

## ✅ Test 6: Delete Question (30 seconds)

1. Find any question
2. Click **"Delete"** button
3. Click **"Cancel"** in confirmation dialog

**Expected Results**:
- ✅ Question is NOT deleted

4. Click **"Delete"** again
5. Click **"OK"** in confirmation dialog

**Expected Results**:
- ✅ Question disappears from list immediately
- ✅ Console shows: "Quiz deleted successfully"

---

## ✅ Test 7: Question Type Switching (1 minute)

1. Click **"+ Create Quiz"**
2. Question Type is "MCQ" by default
   - ✅ Options A, B, C, D are visible
3. Change Question Type to **"Short Answer"**
   - ✅ Options A, B, C, D disappear
4. Change Question Type back to **"MCQ"**
   - ✅ Options A, B, C, D appear again (empty)
5. Click **"Cancel"**

---

## ✅ Test 8: Combined Filters (1 minute)

1. Set filters:
   - Subject: "Mathematics"
   - Class: "9"
   - Question Type: "MCQ"

**Expected Results**:
- ✅ Only Math + Class 9 + MCQ questions shown
- ✅ Count updates correctly

2. Reset filters:
   - Subject: "All Subjects"
   - Class: "All Classes"
   - Question Type: "All Types"

**Expected Results**:
- ✅ All questions shown again

---

## ✅ Test 9: All Subjects Available (2 minutes)

1. Click **"+ Create Quiz"**
2. Click **Subject** dropdown
3. **Verify** you see all these options:
   - ✅ Mathematics
   - ✅ Higher Mathematics
   - ✅ Physics
   - ✅ Chemistry
   - ✅ Biology
   - ✅ General Science
   - ✅ Bangla 1st Paper
   - ✅ Bangla 2nd Paper
   - ✅ English 1st Paper
   - ✅ English 2nd Paper
   - ✅ ICT
   - ✅ Bangladesh & Global Studies
   - ✅ History
   - ✅ Geography
   - ✅ Civics
   - ✅ Accounting
   - ✅ Finance & Banking
   - ✅ Business Entrepreneurship
   - ✅ Economics
   - ✅ General Science

4. Click **"Cancel"**

---

## ✅ Test 10: Dark Mode (30 seconds)

1. Toggle dark mode on (if available)
2. **Check**:
   - ✅ Background is dark
   - ✅ Text is readable
   - ✅ Modals have dark background
   - ✅ Buttons are visible
3. Toggle dark mode off
4. **Check**:
   - ✅ Everything returns to light mode

---

## 🐛 What to Check in Console

Open Browser Console (F12) and look for these messages:

### When Creating:
```
Creating quiz with data: {subject: "math", class_target: 9, ...}
Quiz created successfully: {id: 123, subject: "math", ...}
Fetched quizzes: [...]
```

### When Editing:
```
Editing quiz: {id: 123, subject: "math", ...}
Parsed options: {A: "text", B: "text", C: "text", D: "text"}
Updating quiz with data: {...}
Quiz updated successfully: {...}
```

### When Filtering:
```
(No errors should appear)
```

### When AI Generating:
```
Generating AI question with params: {subject: "chemistry", ...}
AI generated question: {id: 124, ...}
Fetched quizzes: [...]
```

### When Deleting:
```
Quiz deleted successfully
```

---

## ❌ Common Errors & Solutions

### Error: "Failed to create quiz: subject not valid"
**Solution**: This shouldn't happen anymore! If it does, check that SUBJECT_OPTIONS is being used.

### Error: "Options not showing when editing"
**Solution**: Check console for "Parsed options:" - should show object with A, B, C, D keys.

### Error: "AI generation fails"
**Solution**: 
1. Check backend logs for Gemini API errors
2. Verify API key is configured
3. Check if quota is exceeded

### Error: "Filters don't work"
**Solution**: This shouldn't happen anymore! If it does, check console for errors.

---

## ✅ Success Criteria

All tests pass when:
- ✅ Can create MCQ, Short, and Long questions
- ✅ Can edit any question and changes save
- ✅ Can delete questions with confirmation
- ✅ Filters work for subject, class, and type
- ✅ AI generation creates and saves questions automatically
- ✅ All 20 subjects are available
- ✅ Question type switching works smoothly
- ✅ No errors in console
- ✅ Dark mode works (if available)

---

## 🎉 If All Tests Pass

**CONGRATULATIONS!** 🎊

The Quiz Management page is working perfectly! You can now:
- Create questions manually or with AI
- Edit and delete questions
- Filter questions by multiple criteria
- Manage questions for all subjects and classes

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

[ ] Test 1: Create MCQ Question
[ ] Test 2: Create Short Answer Question
[ ] Test 3: Filter by Subject
[ ] Test 4: Edit Question
[ ] Test 5: AI Generation
[ ] Test 6: Delete Question
[ ] Test 7: Question Type Switching
[ ] Test 8: Combined Filters
[ ] Test 9: All Subjects Available
[ ] Test 10: Dark Mode

Console Errors: [ ] None  [ ] Some (describe below)

Overall Status: [ ] PASS  [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🚀 Ready to Go!

Follow these tests in order, and you'll verify that everything works correctly. The entire test suite should take about 10-15 minutes.

**Happy Testing!** 🎯
