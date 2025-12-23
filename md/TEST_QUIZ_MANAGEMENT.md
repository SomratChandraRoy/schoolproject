# Quick Test Guide - Quiz Management Page

## 🚀 How to Test

### 1. Access the Page
Navigate to: `/quiz/manage`

**Requirements**: 
- Must be logged in as Teacher or Admin
- Students cannot access this page

---

### 2. Test CREATE Operations

#### Manual Creation
1. Click **"+ Create Quiz"** button
2. Fill in all fields:
   - Select Subject (e.g., Math)
   - Select Class (e.g., 9)
   - Select Difficulty (e.g., Medium)
   - Select Question Type (e.g., MCQ)
   - Enter Question Text
   - If MCQ: Fill Options A, B, C, D
   - Enter Correct Answer
   - Enter Explanation (optional)
3. Click **"Create Question"**
4. ✅ Verify: Success alert appears
5. ✅ Verify: New question appears in the list

#### AI Generation
1. Click **"✨ Generate with AI"** button
2. Select parameters:
   - Subject (e.g., Physics)
   - Class (e.g., 10)
   - Difficulty (e.g., Hard)
   - Question Type (e.g., Short)
3. Click **"Generate"**
4. ✅ Verify: Loading state shows "Generating..."
5. ✅ Verify: Create modal opens with pre-filled data
6. Review and click **"Create Question"**
7. ✅ Verify: Question is created successfully

---

### 3. Test READ Operations

1. ✅ Verify: All questions are displayed in a list
2. ✅ Verify: Each question shows:
   - Question text (truncated at 150 chars)
   - Subject badge (blue)
   - Class badge (green)
   - Difficulty badge (purple)
   - Question Type badge (gray)
   - Correct answer preview (truncated at 100 chars)
3. ✅ Verify: "Showing X of Y questions" count is correct
4. ✅ Verify: Empty state shows when no questions exist

---

### 4. Test UPDATE Operations

1. Find any question in the list
2. Click **"Edit"** button
3. ✅ Verify: Edit modal opens with pre-filled data
4. Modify any field (e.g., change difficulty from Medium to Hard)
5. Click **"Update Question"**
6. ✅ Verify: Success alert appears
7. ✅ Verify: Changes are reflected in the list
8. Refresh page
9. ✅ Verify: Changes persist after refresh

---

### 5. Test DELETE Operations

1. Find any question in the list
2. Click **"Delete"** button
3. ✅ Verify: Confirmation dialog appears
4. Click **"Cancel"** first
5. ✅ Verify: Question is NOT deleted
6. Click **"Delete"** again
7. Click **"OK"** on confirmation
8. ✅ Verify: Question is removed from list immediately
9. Refresh page
10. ✅ Verify: Question is permanently deleted

---

### 6. Test FILTER Operations

#### Filter by Subject
1. Select "Math" from Subject dropdown
2. ✅ Verify: Only Math questions are shown
3. ✅ Verify: Count updates (e.g., "Showing 5 of 20 questions")

#### Filter by Class
1. Select "Class 9" from Class dropdown
2. ✅ Verify: Only Class 9 questions are shown
3. ✅ Verify: Count updates

#### Filter by Question Type
1. Select "MCQ" from Question Type dropdown
2. ✅ Verify: Only MCQ questions are shown
3. ✅ Verify: Count updates

#### Combined Filters
1. Select "Math" + "Class 9" + "MCQ"
2. ✅ Verify: Only questions matching ALL filters are shown
3. ✅ Verify: Count updates correctly

#### Reset Filters
1. Select "All Subjects" + "All Classes" + "All Types"
2. ✅ Verify: All questions are shown again
3. ✅ Verify: Count shows total (e.g., "Showing 20 of 20 questions")

---

### 7. Test Different Question Types

#### MCQ Questions
1. Create/Edit MCQ question
2. ✅ Verify: Options A, B, C, D fields appear
3. ✅ Verify: All options are required
4. ✅ Verify: Correct answer format: "A) Option text"

#### Short Answer Questions
1. Create/Edit Short Answer question
2. ✅ Verify: Options A, B, C, D fields do NOT appear
3. ✅ Verify: Correct answer is free text

#### Long Answer Questions
1. Create/Edit Long Answer question
2. ✅ Verify: Options A, B, C, D fields do NOT appear
3. ✅ Verify: Correct answer is free text

---

### 8. Test All Classes (6-12)

For each class (6, 7, 8, 9, 10, 11, 12):
1. Create a question for that class
2. ✅ Verify: Question is created successfully
3. Filter by that class
4. ✅ Verify: Question appears in filtered results

---

### 9. Test All Subjects

For each subject:
- Math
- Physics
- Chemistry
- Biology
- English
- Bangla
- ICT
- General Knowledge

1. Create a question for that subject
2. ✅ Verify: Question is created successfully
3. Filter by that subject
4. ✅ Verify: Question appears in filtered results

---

### 10. Test UI/UX

#### Dark Mode
1. Toggle dark mode on
2. ✅ Verify: All elements have proper dark colors
3. ✅ Verify: Text is readable
4. ✅ Verify: Modals have dark background
5. Toggle dark mode off
6. ✅ Verify: All elements return to light colors

#### Responsive Design
1. Resize browser window to mobile size (< 768px)
2. ✅ Verify: Layout adapts to mobile
3. ✅ Verify: Buttons are accessible
4. ✅ Verify: Modals are scrollable
5. ✅ Verify: Filters stack vertically

#### Loading States
1. Refresh page
2. ✅ Verify: Loading spinner appears
3. ✅ Verify: "Loading quizzes..." message shows
4. ✅ Verify: Content appears after loading

#### Empty States
1. Apply filters that match no questions
2. ✅ Verify: "No quizzes match the selected filters" message
3. ✅ Verify: "Try adjusting your filters" hint
4. Delete all questions (if testing in dev)
5. ✅ Verify: "No quizzes found" message
6. ✅ Verify: "Create your first quiz or generate one with AI" hint

---

## 🐛 Common Issues to Check

### Issue 1: Questions not loading
- **Check**: Are you logged in as Teacher/Admin?
- **Check**: Is backend server running?
- **Check**: Check browser console for errors

### Issue 2: Create/Update fails
- **Check**: Are all required fields filled?
- **Check**: For MCQ, are all 4 options filled?
- **Check**: Is correct_answer in correct format?

### Issue 3: Filters not working
- **Check**: Are there questions matching the filter?
- **Check**: Try "All" option to reset
- **Check**: Check browser console for errors

### Issue 4: AI generation fails
- **Check**: Is Gemini API key configured in backend?
- **Check**: Check backend logs for API errors
- **Check**: Try different parameters

---

## ✅ Success Criteria

All tests pass when:
- ✅ Can create questions manually (all types)
- ✅ Can generate questions with AI (all types)
- ✅ Can view all questions with proper formatting
- ✅ Can edit any question and changes persist
- ✅ Can delete questions with confirmation
- ✅ Filters work correctly (single and combined)
- ✅ All classes (6-12) work
- ✅ All subjects work
- ✅ All question types work (MCQ, Short, Long)
- ✅ Dark mode works properly
- ✅ Responsive design works on mobile
- ✅ No TypeScript errors in console
- ✅ No runtime errors in console

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

CREATE Operations:
[ ] Manual MCQ
[ ] Manual Short
[ ] Manual Long
[ ] AI MCQ
[ ] AI Short
[ ] AI Long

READ Operations:
[ ] View all questions
[ ] Badges display correctly
[ ] Truncation works
[ ] Empty state

UPDATE Operations:
[ ] Edit MCQ
[ ] Edit Short
[ ] Edit Long
[ ] Changes persist

DELETE Operations:
[ ] Delete with confirmation
[ ] Cancel works

FILTER Operations:
[ ] Filter by subject
[ ] Filter by class
[ ] Filter by type
[ ] Combined filters
[ ] Reset filters

Classes (6-12):
[ ] Class 6
[ ] Class 7
[ ] Class 8
[ ] Class 9
[ ] Class 10
[ ] Class 11
[ ] Class 12

Subjects:
[ ] Math
[ ] Physics
[ ] Chemistry
[ ] Biology
[ ] English
[ ] Bangla
[ ] ICT
[ ] General Knowledge

UI/UX:
[ ] Dark mode
[ ] Responsive design
[ ] Loading states
[ ] Empty states

Overall Status: [ ] PASS  [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎉 Ready to Test!

The Quiz Management page is fully implemented and ready for comprehensive testing. Follow this guide to ensure all features work correctly across all classes, subjects, and question types.
