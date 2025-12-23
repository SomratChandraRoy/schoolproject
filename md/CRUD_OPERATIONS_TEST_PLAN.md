# CRUD Operations - Complete Test Plan

## 🎯 OBJECTIVE

Test ALL CRUD operations (Create, Read, Update, Delete) for:
- ✅ All Classes: 6, 7, 8, 9, 10, 11, 12
- ✅ All Subjects: 20 subjects
- ✅ All Difficulties: Easy, Medium, Hard
- ✅ All Question Types: MCQ, Short Answer, Long Answer

---

## 📋 TEST MATRIX

### Total Combinations to Test:
- Classes: 7 (6-12)
- Subjects: 20
- Difficulties: 3
- Question Types: 3
- **Total**: 7 × 20 × 3 × 3 = 1,260 possible combinations

### Practical Testing Strategy:
We'll test representative samples from each category to ensure all work.

---

## ✅ TEST 1: CREATE Operations

### Test 1.1: Create MCQ for Each Class (7 tests)

**For Classes 6, 7, 8, 9, 10, 11, 12:**

1. Click **"+ Create Quiz"**
2. Fill form:
   - Subject: Mathematics
   - Class: [6/7/8/9/10/11/12]
   - Difficulty: Medium
   - Question Type: MCQ
   - Question: "Test question for Class [X]"
   - Options A-D: Fill with test data
   - Correct Answer: "A) Test answer"
   - Explanation: "Test explanation"
3. Click **"Create Question"**

**Expected Results:**
- ✅ Success alert appears
- ✅ Question appears in list
- ✅ Badge shows correct class
- ✅ Console shows: "Quiz created successfully"

**Status:**
- [ ] Class 6
- [ ] Class 7
- [ ] Class 8
- [ ] Class 9
- [ ] Class 10
- [ ] Class 11
- [ ] Class 12

### Test 1.2: Create for Each Subject (20 tests)

**For each subject in SUBJECT_OPTIONS:**

1. Click **"+ Create Quiz"**
2. Fill form:
   - Subject: [Select from list]
   - Class: 9
   - Difficulty: Medium
   - Question Type: MCQ
   - Fill other fields
3. Click **"Create Question"**

**Expected Results:**
- ✅ Success for all 20 subjects
- ✅ Subject label displays correctly

**Subjects to Test:**
- [ ] Mathematics
- [ ] Higher Mathematics
- [ ] Physics
- [ ] Chemistry
- [ ] Biology
- [ ] General Science
- [ ] Bangla 1st Paper
- [ ] Bangla 2nd Paper
- [ ] English 1st Paper
- [ ] English 2nd Paper
- [ ] ICT
- [ ] Bangladesh & Global Studies
- [ ] History
- [ ] Geography
- [ ] Civics
- [ ] Accounting
- [ ] Finance & Banking
- [ ] Business Entrepreneurship
- [ ] Economics
- [ ] General Science

### Test 1.3: Create for Each Difficulty (3 tests)

**For Easy, Medium, Hard:**

1. Create question with each difficulty
2. Verify badge shows correct difficulty

**Status:**
- [ ] Easy
- [ ] Medium
- [ ] Hard

### Test 1.4: Create for Each Question Type (3 tests)

#### MCQ Question:
1. Select "MCQ"
2. ✅ Options A-D fields appear
3. Fill all options
4. Create successfully

#### Short Answer Question:
1. Select "Short Answer"
2. ✅ Options A-D fields disappear
3. Fill question and answer
4. Create successfully

#### Long Answer Question:
1. Select "Long Answer"
2. ✅ Options A-D fields disappear
3. Fill question and answer
4. Create successfully

**Status:**
- [ ] MCQ
- [ ] Short Answer
- [ ] Long Answer

---

## ✅ TEST 2: READ Operations

### Test 2.1: View All Questions

1. Open `/quiz/manage`
2. Check console: "Fetched quizzes: X questions"
3. Verify all questions display

**Expected:**
- ✅ See questions from all classes
- ✅ See questions from all subjects
- ✅ All badges display correctly
- ✅ Question text truncated at 150 chars
- ✅ Answer truncated at 100 chars

**Status:** [ ]

### Test 2.2: Filter by Each Class

**For Classes 6-12:**

1. Select class from dropdown
2. Verify only that class's questions show
3. Check count: "Showing X of Y questions"

**Status:**
- [ ] Class 6
- [ ] Class 7
- [ ] Class 8
- [ ] Class 9
- [ ] Class 10
- [ ] Class 11
- [ ] Class 12

### Test 2.3: Filter by Each Subject

**For all 20 subjects:**

1. Select subject from dropdown
2. Verify only that subject's questions show
3. Check active filter badge appears

**Status:**
- [ ] Test at least 5 different subjects
- [ ] Verify subject labels display correctly (not codes)

### Test 2.4: Filter by Question Type

1. Select "MCQ" → Only MCQ questions
2. Select "Short Answer" → Only short questions
3. Select "Long Answer" → Only long questions

**Status:**
- [ ] MCQ filter
- [ ] Short Answer filter
- [ ] Long Answer filter

### Test 2.5: Combined Filters

1. Select: Math + Class 9 + MCQ
2. Verify only questions matching ALL criteria show
3. Check active filter badges show all three

**Status:** [ ]

---

## ✅ TEST 3: UPDATE Operations

### Test 3.1: Update Question to Different Class

1. Find any question
2. Click **"Edit"**
3. Change class from 9 to 10
4. Click **"Update Question"**
5. Verify badge shows "Class 10"

**Status:**
- [ ] Change to each class (6-12)

### Test 3.2: Update Question to Different Subject

1. Edit any question
2. Change subject (e.g., Math → Physics)
3. Update
4. Verify subject badge changes

**Status:**
- [ ] Change to at least 5 different subjects

### Test 3.3: Update Question to Different Difficulty

1. Edit any question
2. Change difficulty (Easy → Medium → Hard)
3. Update
4. Verify difficulty badge changes

**Status:**
- [ ] Easy → Medium
- [ ] Medium → Hard
- [ ] Hard → Easy

### Test 3.4: Update Question Type

#### MCQ → Short Answer:
1. Edit MCQ question
2. Change type to "Short Answer"
3. ✅ Options fields disappear
4. Update correct_answer to text (not "A) text")
5. Update successfully

#### Short Answer → MCQ:
1. Edit short answer question
2. Change type to "MCQ"
3. ✅ Options fields appear (empty)
4. Fill options A-D
5. Update correct_answer to "A) text" format
6. Update successfully

#### MCQ → Long Answer:
1. Edit MCQ question
2. Change type to "Long Answer"
3. Update successfully

**Status:**
- [ ] MCQ → Short
- [ ] MCQ → Long
- [ ] Short → MCQ
- [ ] Short → Long
- [ ] Long → MCQ
- [ ] Long → Short

### Test 3.5: Update All Fields at Once

1. Edit any question
2. Change:
   - Subject
   - Class
   - Difficulty
   - Question text
   - Options (if MCQ)
   - Correct answer
   - Explanation
3. Update
4. Verify all changes saved

**Status:** [ ]

---

## ✅ TEST 4: DELETE Operations

### Test 4.1: Delete Questions from Each Class

1. Find question from Class 6
2. Click **"Delete"**
3. Click **"Cancel"** → Question NOT deleted
4. Click **"Delete"** again
5. Click **"OK"** → Question deleted
6. Verify question disappears
7. Refresh page → Question still gone

**Repeat for all classes:**
- [ ] Class 6
- [ ] Class 7
- [ ] Class 8
- [ ] Class 9
- [ ] Class 10
- [ ] Class 11
- [ ] Class 12

### Test 4.2: Delete Questions of Each Type

1. Delete MCQ question
2. Delete Short Answer question
3. Delete Long Answer question

**Status:**
- [ ] MCQ
- [ ] Short Answer
- [ ] Long Answer

### Test 4.3: Delete Questions from Each Subject

1. Delete questions from at least 5 different subjects
2. Verify deletion works for all

**Status:**
- [ ] Test 5 different subjects

---

## ✅ TEST 5: AI GENERATION

### Test 5.1: Generate for Each Class

**For Classes 6-12:**

1. Click **"✨ Generate with AI"**
2. Select:
   - Subject: Mathematics
   - Class: [6/7/8/9/10/11/12]
   - Difficulty: Medium
   - Type: MCQ
3. Click **"Generate"**
4. Wait for generation
5. Verify question created for correct class

**Status:**
- [ ] Class 6
- [ ] Class 7
- [ ] Class 8
- [ ] Class 9
- [ ] Class 10
- [ ] Class 11
- [ ] Class 12

### Test 5.2: Generate for Each Subject

**Test at least 5 subjects:**

1. Generate question for each subject
2. Verify subject is correct

**Status:**
- [ ] Mathematics
- [ ] Physics
- [ ] Chemistry
- [ ] Biology
- [ ] English 1st Paper

### Test 5.3: Generate for Each Type

1. Generate MCQ → Verify has options
2. Generate Short Answer → Verify no options
3. Generate Long Answer → Verify no options

**Status:**
- [ ] MCQ
- [ ] Short Answer
- [ ] Long Answer

---

## 🐛 COMMON ISSUES TO CHECK

### Issue 1: Options Not Saving for MCQ
**Check:**
- [ ] Options object has A, B, C, D keys
- [ ] Each option has text value
- [ ] Console shows correct format: `{A: "text", B: "text", ...}`

### Issue 2: Edit Modal Shows Empty Options
**Check:**
- [ ] Console shows "Parsed options:"
- [ ] Options converted from array to object correctly
- [ ] All 4 options (A-D) appear in form

### Issue 3: Question Type Switch Doesn't Work
**Check:**
- [ ] Options appear when switching to MCQ
- [ ] Options disappear when switching to Short/Long
- [ ] No errors in console

### Issue 4: Subject Filter Doesn't Work
**Check:**
- [ ] Subject codes match backend (e.g., "bangla_1st" not "bangla")
- [ ] Console shows correct filter being applied
- [ ] Active filter badge appears

### Issue 5: Can't Create for Certain Classes
**Check:**
- [ ] All classes (6-12) in dropdown
- [ ] Backend accepts all class values
- [ ] No validation errors

---

## 📊 TEST RESULTS TEMPLATE

```
Date: ___________
Tester: ___________
Environment: Development / Production

CREATE Operations:
[ ] All classes (6-12) ___/7
[ ] All subjects (sample) ___/20
[ ] All difficulties ___/3
[ ] All question types ___/3
Issues: _______________________

READ Operations:
[ ] View all questions
[ ] Filter by class ___/7
[ ] Filter by subject ___/5
[ ] Filter by type ___/3
[ ] Combined filters
Issues: _______________________

UPDATE Operations:
[ ] Change class ___/7
[ ] Change subject ___/5
[ ] Change difficulty ___/3
[ ] Change question type ___/6
[ ] Update all fields
Issues: _______________________

DELETE Operations:
[ ] Delete from each class ___/7
[ ] Delete each type ___/3
[ ] Delete from subjects ___/5
Issues: _______________________

AI GENERATION:
[ ] Generate for each class ___/7
[ ] Generate for subjects ___/5
[ ] Generate for each type ___/3
Issues: _______________________

Overall Status: [ ] PASS  [ ] FAIL

Critical Issues Found:
1. _______________________
2. _______________________
3. _______________________

Notes:
_________________________________
_________________________________
_________________________________
```

---

## ✅ SUCCESS CRITERIA

All tests pass when:

**CREATE:**
- ✅ Can create questions for ALL classes (6-12)
- ✅ Can create questions for ALL subjects (20 subjects)
- ✅ Can create questions for ALL difficulties (Easy, Medium, Hard)
- ✅ Can create ALL question types (MCQ, Short, Long)
- ✅ MCQ questions save with options
- ✅ Short/Long questions save without options

**READ:**
- ✅ Can view ALL questions from database
- ✅ Can filter by ANY class
- ✅ Can filter by ANY subject
- ✅ Can filter by ANY question type
- ✅ Combined filters work correctly
- ✅ Subject labels display correctly (not codes)

**UPDATE:**
- ✅ Can change question to ANY class
- ✅ Can change question to ANY subject
- ✅ Can change question to ANY difficulty
- ✅ Can change question type (MCQ ↔ Short ↔ Long)
- ✅ Options appear/disappear when changing type
- ✅ All changes persist after save

**DELETE:**
- ✅ Can delete questions from ANY class
- ✅ Can delete ANY question type
- ✅ Can delete questions from ANY subject
- ✅ Confirmation dialog works
- ✅ Deletion persists after refresh

**AI GENERATION:**
- ✅ Can generate for ALL classes
- ✅ Can generate for ALL subjects
- ✅ Can generate ALL question types
- ✅ Generated questions save automatically
- ✅ Generated questions appear immediately

---

## 🚀 QUICK SMOKE TEST (5 minutes)

If you don't have time for full testing, run this quick smoke test:

1. **CREATE**: Create one question for Class 6, 9, and 12 (3 tests)
2. **READ**: Filter by each class and verify (3 tests)
3. **UPDATE**: Edit one question, change class and subject (1 test)
4. **DELETE**: Delete one question (1 test)
5. **AI**: Generate one question (1 test)

**Total: 9 tests in 5 minutes**

If all pass → ✅ System likely working correctly
If any fail → ❌ Run full test suite to identify issues

---

## 💡 DEBUGGING TIPS

### If CREATE fails:
1. Check console for error message
2. Check Network tab → POST /api/quizzes/
3. Look at request payload
4. Check backend logs

### If READ fails:
1. Check console: "Fetched quizzes: X questions"
2. If X is small, backend still filtering
3. Restart backend server

### If UPDATE fails:
1. Check console: "Updating quiz with data:"
2. Check Network tab → PUT /api/quizzes/{id}/
3. Verify all fields in payload

### If DELETE fails:
1. Check Network tab → DELETE /api/quizzes/{id}/
2. Check for 403 Forbidden (permission issue)
3. Verify user is teacher/admin

### If AI GENERATION fails:
1. Check console for Gemini API errors
2. Check backend logs for API key issues
3. Verify quota not exceeded

---

## 🎯 FINAL VERIFICATION

After completing all tests, verify:

- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] All CRUD operations work for all combinations
- [ ] Filters work correctly
- [ ] UI is responsive and user-friendly
- [ ] Data persists after page refresh
- [ ] Permissions work correctly (only teachers/admins can manage)

**If all checked → PRODUCTION READY!** 🎉
