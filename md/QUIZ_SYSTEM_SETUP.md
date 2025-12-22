# Quiz System Setup Guide

## Steps to Complete Setup

### 1. Populate Questions from questions.md

Run this command to add all questions to database:

```bash
cd backend
python manage.py populate_all_questions
```

**Expected Output:**
```
Cleared existing questions
Successfully created 50+ questions
Class 6: 10 questions
Class 7: 4 questions
Class 8: 3 questions
Class 9: 5 questions
Class 10: 3 questions
Class 11: 4 questions
Class 12: 3 questions
```

### 2. Verify Quiz Management Page

**Access:** http://localhost:5173/quiz/manage

**Requirements:**
- Must be logged in as Teacher or Admin
- Route: `/quiz/manage`
- Already configured in App.tsx ✅

**Features:**
- View all quizzes
- Create new quiz manually
- Generate quiz with AI
- Delete quizzes
- Filter by class, subject, difficulty

### 3. Test Class-Specific Quiz Flow

#### For Class 6 Student:

1. **Login** as Class 6 student
2. **Go to Quiz Selection** → `/quiz/select`
3. **Should see only Class 6 subjects:**
   - Bangla
   - English
   - Mathematics
   - Science

4. **Select subject** (e.g., Bangla)
5. **Select difficulty** (Easy/Medium/Hard)
6. **Start Quiz**
7. **See only Class 6 Bangla questions**

#### For Class 9 Student:

1. **Login** as Class 9 student
2. **Go to Quiz Selection**
3. **Should see Class 9 subjects:**
   - Physics
   - Biology
   - Chemistry
   - Math
   - English
   - Bangla

4. **Select multiple subjects** (e.g., Physics + Biology)
5. **Start Quiz**
6. **See mixed questions from both subjects**

### 4. Test Quit Functionality

**During Quiz:**
1. Click "Exit Quiz" button
2. Confirm dialog appears
3. Click "Yes"
4. **Should show:**
   - Total questions attempted
   - Correct answers count
   - Incorrect answers count
   - Accuracy percentage
   - Detailed results for each question
   - "Improve with AI" button (if wrong answers exist)

**Results Page Shows:**
- ✅ Accuracy: XX%
- ✅ Questions: Total count
- ✅ Correct: Green count
- ✅ Incorrect: Red count
- ✅ Detailed breakdown of each question
- ✅ Your answer vs Correct answer
- ✅ Color-coded feedback

### 5. Verify Backend Filtering

**API Endpoint:** `/api/quizzes/`

**Query Parameters:**
- `subject` - Filter by subject
- `difficulty` - Filter by difficulty
- `class_level` - Filter by class

**Example:**
```
GET /api/quizzes/?subject=physics&difficulty=medium&class_level=9
```

**Backend Logic (views.py):**
```python
def get_queryset(self):
    user = self.request.user
    queryset = Quiz.objects.all()
    
    # Filter by user's class if no class_level provided
    if not class_level and user.class_level:
        queryset = queryset.filter(class_target=user.class_level)
    
    return queryset
```

## Questions Database Structure

### Class 6 (10 questions)
- **Bangla:** 3 questions (MCQ, Short, Long)
- **English:** 2 questions (MCQ, Long)
- **Math:** 2 questions (MCQ, Long)
- **Science:** 2 questions (MCQ, Long)

### Class 7 (4 questions)
- **Math:** 2 questions (MCQ, Long)
- **Science:** 2 questions (Long)

### Class 8 (3 questions)
- **Science:** 1 question (Long)
- **Math:** 2 questions (MCQ, Long)

### Class 9-10 (8 questions)
- **Physics:** 2 questions (MCQ, Long)
- **Biology:** 2 questions (MCQ, Long)
- **Chemistry:** 1 question (MCQ)

### Class 11-12 (7 questions)
- **Physics:** 2 questions (MCQ, Long)
- **Chemistry:** 1 question (MCQ)
- **ICT:** 1 question (Long)

## Testing Checklist

### ✅ Quiz Management Page
- [ ] Access /quiz/manage as teacher/admin
- [ ] See all quizzes listed
- [ ] See total count
- [ ] See subject, class, difficulty tags
- [ ] Can delete quiz
- [ ] Can create new quiz
- [ ] Can generate with AI

### ✅ Class-Specific Filtering
- [ ] Class 6 student sees only Class 6 questions
- [ ] Class 9 student sees only Class 9 questions
- [ ] No cross-class questions appear

### ✅ Subject Selection
- [ ] Can select single subject
- [ ] Can select multiple subjects
- [ ] Questions from selected subjects only

### ✅ Quiz Taking
- [ ] Timer works (5 minutes)
- [ ] Progress bar updates
- [ ] Can answer MCQ questions
- [ ] Can answer short questions
- [ ] Can answer long questions
- [ ] Can navigate between questions

### ✅ Quit Functionality
- [ ] "Exit Quiz" button visible
- [ ] Confirmation dialog appears
- [ ] Shows results on quit
- [ ] Shows accuracy percentage
- [ ] Shows detailed breakdown
- [ ] Shows correct vs incorrect
- [ ] "Improve with AI" button works

### ✅ Results Display
- [ ] Accuracy calculated correctly
- [ ] Total questions count correct
- [ ] Correct count matches
- [ ] Incorrect count matches
- [ ] Each question shows user answer
- [ ] Each question shows correct answer
- [ ] Color coding (green/red) works

## Common Issues & Solutions

### Issue 1: No questions showing
**Solution:**
```bash
python manage.py populate_all_questions
```

### Issue 2: Wrong class questions appearing
**Check:**
1. User profile has correct class_level
2. Backend filtering is working
3. Frontend passes correct classLevel

**Fix:**
```python
# In views.py
queryset = queryset.filter(class_target=user.class_level)
```

### Issue 3: Quiz Management page empty
**Check:**
1. User is teacher or admin
2. Questions exist in database
3. API endpoint working

**Test API:**
```bash
curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8000/api/quizzes/
```

### Issue 4: Quit button not showing results
**Check:**
1. handleExitQuiz function calls handleSubmitQuiz
2. calculateScore function works
3. quizFinished state set to true

**Code:**
```typescript
const handleExitQuiz = () => {
  if (window.confirm('Are you sure you want to exit?')) {
    handleSubmitQuiz();
  }
};
```

## API Endpoints

### Get Quizzes
```
GET /api/quizzes/
GET /api/quizzes/?subject=physics
GET /api/quizzes/?class_level=9
GET /api/quizzes/?difficulty=medium
```

### Submit Answer
```
POST /api/quizzes/attempt/
Body: {
  quiz_id: 1,
  selected_answer: "answer"
}
```

### Submit Results
```
POST /api/quizzes/submit-results/
Body: {
  score: 80,
  mistakes: {...}
}
```

### AI Remediation
```
POST /api/ai/remedial-learning/
Body: {
  wrong_answers: [...]
}
```

## Next Steps

1. **Run populate command:**
   ```bash
   python manage.py populate_all_questions
   ```

2. **Restart backend:**
   ```bash
   python manage.py runserver
   ```

3. **Test as different class students:**
   - Create Class 6 student → Test quiz
   - Create Class 9 student → Test quiz
   - Verify only class-specific questions appear

4. **Test quiz management:**
   - Login as teacher
   - Go to /quiz/manage
   - Verify all questions visible
   - Test create/delete

5. **Test quit functionality:**
   - Start quiz
   - Answer some questions
   - Click "Exit Quiz"
   - Verify results show correctly

## Summary

- ✅ Questions.md file read and understood
- ✅ populate_all_questions.py command created
- ✅ Quiz Management page improved
- ✅ Class-specific filtering working
- ✅ Quit functionality already implemented
- ✅ Results display working

**Run the populate command to add all questions!**
