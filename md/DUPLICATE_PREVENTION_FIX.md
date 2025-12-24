# 🔒 Duplicate Attempt Prevention - Complete Fix

## Issue

User was getting `IntegrityError` when attempting to answer the same question twice in adaptive quiz mode:

```
django.db.utils.IntegrityError: duplicate key value violates unique constraint 
"quizzes_quizattempt_user_id_quiz_id_b1be0204_uniq"
DETAIL: Key (user_id, quiz_id)=(5, 327) already exists.
```

## Root Cause

The `AdaptiveQuizSubmitAnswerView` was missing the duplicate check that we added to the regular `QuizAttemptView`. When a user tried to answer the same question twice, it attempted to create a duplicate `QuizAttempt` record, violating the unique constraint.

## Solution

Added duplicate prevention checks to both static and AI question handling in the adaptive quiz submit endpoint.

---

## Implementation

### File: `backend/quizzes/adaptive_views.py`

#### For Static Questions

```python
if source == 'static':
    try:
        question = Quiz.objects.get(id=question_id)
        
        # CRITICAL: Check if user has already answered this question
        existing_attempt = QuizAttempt.objects.filter(
            user=user,
            quiz=question
        ).first()
        
        if existing_attempt:
            return Response({
                'error': 'You have already answered this question',
                'message': 'This question cannot be attempted again',
                'already_answered': True,
                'previous_attempt': {
                    'selected_answer': existing_attempt.selected_answer,
                    'is_correct': existing_attempt.is_correct,
                    'attempted_at': existing_attempt.attempted_at
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Continue with saving attempt...
```

#### For AI Questions

```python
elif source == 'ai':
    try:
        question = AIGeneratedQuestion.objects.get(id=question_id, user=user)
        
        # CRITICAL: Check if already answered
        if question.is_answered:
            return Response({
                'error': 'You have already answered this question',
                'message': 'This AI question cannot be attempted again',
                'already_answered': True,
                'previous_attempt': {
                    'selected_answer': question.user_answer,
                    'is_correct': question.is_correct,
                    'attempted_at': question.answered_at
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Continue with updating question...
```

---

## Protection Layers

Now we have **3 layers of protection** against duplicate attempts:

### Layer 1: Database Constraint ✅
```python
class QuizAttempt(models.Model):
    class Meta:
        unique_together = ['user', 'quiz']
```
- Prevents duplicates at database level
- Last line of defense

### Layer 2: Regular Quiz Endpoint ✅
```python
# In QuizAttemptView.post()
existing_attempt = QuizAttempt.objects.filter(user=user, quiz=quiz).first()
if existing_attempt:
    return Response({'error': 'Already answered'}, status=400)
```
- Checks before creating attempt
- Returns friendly error

### Layer 3: Adaptive Quiz Endpoint ✅
```python
# In AdaptiveQuizSubmitAnswerView.post()
# For static questions
existing_attempt = QuizAttempt.objects.filter(user=user, quiz=question).first()
if existing_attempt:
    return Response({'error': 'Already answered'}, status=400)

# For AI questions
if question.is_answered:
    return Response({'error': 'Already answered'}, status=400)
```
- Checks before creating/updating
- Returns friendly error

---

## API Response

### When User Attempts Duplicate

**Request**:
```json
POST /api/quizzes/adaptive/submit/
{
  "question_id": 327,
  "answer": "Some answer",
  "source": "static",
  "subject": "physics",
  "class_level": 10
}
```

**Response** (Error):
```json
{
  "error": "You have already answered this question",
  "message": "This question cannot be attempted again",
  "already_answered": true,
  "previous_attempt": {
    "selected_answer": "Previous answer",
    "is_correct": true,
    "attempted_at": "2025-12-24T19:04:29Z"
  }
}
```

**Status Code**: `400 Bad Request`

---

## Frontend Handling

The frontend should handle this error gracefully:

```typescript
const response = await fetch('/api/quizzes/adaptive/submit/', {
  method: 'POST',
  body: JSON.stringify({
    question_id: questionId,
    answer: answer,
    source: 'static',
    subject: subject,
    class_level: classLevel
  })
});

if (!response.ok) {
  const error = await response.json();
  
  if (error.already_answered) {
    // User already answered this question
    console.log('Question already answered:', error.previous_attempt);
    
    // Skip to next question or show message
    alert('You have already answered this question');
    
    // Move to next question
    fetchNextQuestion();
  }
}
```

---

## Testing

### Test Case 1: Regular Quiz Duplicate

```python
# First attempt - should succeed
response1 = client.post('/api/quizzes/attempt/', {
    'quiz_id': 327,
    'selected_answer': 'Answer A'
})
assert response1.status_code == 201

# Second attempt - should fail
response2 = client.post('/api/quizzes/attempt/', {
    'quiz_id': 327,
    'selected_answer': 'Answer B'
})
assert response2.status_code == 400
assert response2.data['already_answered'] == True
```

### Test Case 2: Adaptive Quiz Duplicate (Static)

```python
# First attempt - should succeed
response1 = client.post('/api/quizzes/adaptive/submit/', {
    'question_id': 327,
    'answer': 'Answer A',
    'source': 'static',
    'subject': 'physics',
    'class_level': 10
})
assert response1.status_code == 201

# Second attempt - should fail
response2 = client.post('/api/quizzes/adaptive/submit/', {
    'question_id': 327,
    'answer': 'Answer B',
    'source': 'static',
    'subject': 'physics',
    'class_level': 10
})
assert response2.status_code == 400
assert response2.data['already_answered'] == True
```

### Test Case 3: Adaptive Quiz Duplicate (AI)

```python
# First attempt - should succeed
response1 = client.post('/api/quizzes/adaptive/submit/', {
    'question_id': 1,
    'answer': 'Answer A',
    'source': 'ai',
    'subject': 'physics',
    'class_level': 10
})
assert response1.status_code == 201

# Second attempt - should fail
response2 = client.post('/api/quizzes/adaptive/submit/', {
    'question_id': 1,
    'answer': 'Answer B',
    'source': 'ai',
    'subject': 'physics',
    'class_level': 10
})
assert response2.status_code == 400
assert response2.data['already_answered'] == True
```

---

## Benefits

### For Users
- ✅ Clear error messages
- ✅ No confusing database errors
- ✅ Knows why attempt failed
- ✅ Can continue with next question

### For System
- ✅ Data integrity maintained
- ✅ No duplicate records
- ✅ Graceful error handling
- ✅ Consistent behavior across endpoints

### For Developers
- ✅ Easy to debug
- ✅ Clear error responses
- ✅ Consistent patterns
- ✅ Well-documented

---

## Files Modified

1. ✅ `backend/quizzes/adaptive_views.py`
   - Added duplicate check for static questions
   - Added duplicate check for AI questions
   - Returns friendly error responses

---

## Status: ✅ FIXED

The duplicate attempt error is now properly handled:
- ✅ Database constraint prevents duplicates
- ✅ Regular quiz endpoint checks duplicates
- ✅ Adaptive quiz endpoint checks duplicates
- ✅ Friendly error messages returned
- ✅ No more IntegrityError crashes

**Date**: December 24, 2025
**Issue**: IntegrityError on duplicate attempts
**Solution**: Added duplicate checks to adaptive quiz endpoint
**Status**: ✅ Complete

---

## Quick Reference

### Error Response Format

```json
{
  "error": "You have already answered this question",
  "message": "This question cannot be attempted again",
  "already_answered": true,
  "previous_attempt": {
    "selected_answer": "...",
    "is_correct": true/false,
    "attempted_at": "ISO timestamp"
  }
}
```

### Status Code
- `400 Bad Request` - Duplicate attempt

### Endpoints Protected
- ✅ `/api/quizzes/attempt/` - Regular quiz
- ✅ `/api/quizzes/adaptive/submit/` - Adaptive quiz (static)
- ✅ `/api/quizzes/adaptive/submit/` - Adaptive quiz (AI)

**Fix Complete!** 🎉
