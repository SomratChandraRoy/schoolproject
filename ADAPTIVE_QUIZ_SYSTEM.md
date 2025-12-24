# Adaptive Quiz System - Complete Implementation

## Overview
The Adaptive Quiz System provides an intelligent, progressive learning experience where students:
1. Start with **static questions** from the database
2. At **90% completion**, AI automatically generates personalized questions
3. **Difficulty increases** based on performance
4. AI **continuously generates** 6 questions ahead

## System Architecture

### Backend Components

#### 1. Models (`quizzes/models.py`)
- **UserQuizProgress**: Tracks user progress per subject/class
  - `static_questions_completed`: Count of static questions answered
  - `total_static_questions`: Total static questions available
  - `static_completion_percentage`: Percentage completed
  - `status`: 'static', 'ai_active', or 'finished'
  - `current_difficulty`: 'easy', 'medium', or 'hard'
  - `ai_questions_answered`: Count of AI questions answered
  - `ai_questions_correct`: Count of correct AI answers

- **AIGeneratedQuestion**: Stores AI-generated questions
  - `user`: Question owner
  - `subject`, `class_level`, `difficulty`: Question metadata
  - `question_text`, `options`, `correct_answer`: Question content
  - `is_answered`, `user_answer`, `is_correct`: Answer tracking
  - `generation_batch`: Batch number for tracking

#### 2. AI Question Generator (`ai/question_generator.py`)
- **QuestionGenerator class**:
  - `generate_batch_questions()`: Generate 6 questions at once
  - `check_and_generate_questions()`: Auto-generate when < 6 unanswered
  - `get_next_question()`: Get next unanswered AI question
  - `update_difficulty_based_on_performance()`: Adjust difficulty

#### 3. Adaptive Quiz Views (`quizzes/adaptive_views.py`)
- **AdaptiveQuizStartView** (`POST /api/quizzes/adaptive/start/`)
  - Initialize quiz session
  - Create/get progress tracker
  - Count total static questions

- **AdaptiveQuizNextQuestionView** (`POST /api/quizzes/adaptive/next/`)
  - Return next question (static or AI)
  - Trigger AI generation at 90% threshold
  - Auto-generate more questions when needed

- **AdaptiveQuizSubmitAnswerView** (`POST /api/quizzes/adaptive/submit/`)
  - Submit answer for static or AI question
  - Update progress
  - Award points (10 for static, 15 for AI)
  - Adjust difficulty based on performance
  - Trigger continuous generation

- **AdaptiveQuizProgressView** (`GET /api/quizzes/adaptive/progress/`)
  - Get current progress for a subject

### API Endpoints

#### Start Quiz Session
```http
POST /api/quizzes/adaptive/start/
Content-Type: application/json
Authorization: Token <token>

{
  "subject": "physics",
  "class_level": 9,
  "question_type": "mcq"
}
```

**Response:**
```json
{
  "progress": {
    "status": "static",
    "static_completed": 0,
    "total_static": 50,
    "completion_percentage": 0.0,
    "current_difficulty": "easy",
    "ai_questions_answered": 0,
    "ai_questions_correct": 0
  },
  "message": "Quiz session initialized"
}
```

#### Get Next Question
```http
POST /api/quizzes/adaptive/next/
Content-Type: application/json
Authorization: Token <token>

{
  "subject": "physics",
  "class_level": 9,
  "question_type": "mcq"
}
```

**Response (Static Question):**
```json
{
  "question": {
    "id": 123,
    "question_text": "What is Newton's first law?",
    "question_type": "mcq",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "difficulty": "medium",
    "subject": "physics",
    "class_target": 9
  },
  "source": "static",
  "progress": {
    "status": "static",
    "completion_percentage": 45.0,
    "current_difficulty": "easy"
  }
}
```

**Response (AI Question):**
```json
{
  "question": {
    "id": 456,
    "question_text": "AI generated question...",
    "question_type": "mcq",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "difficulty": "medium",
    "subject": "physics",
    "class_target": 9
  },
  "source": "ai",
  "progress": {
    "status": "ai_active",
    "completion_percentage": 92.0,
    "current_difficulty": "medium",
    "ai_questions_answered": 5
  }
}
```

#### Submit Answer
```http
POST /api/quizzes/adaptive/submit/
Content-Type: application/json
Authorization: Token <token>

{
  "question_id": 123,
  "answer": "Option A",
  "source": "static",
  "subject": "physics",
  "class_level": 9
}
```

**Response:**
```json
{
  "is_correct": true,
  "correct_answer": "Option A",
  "explanation": "Detailed explanation...",
  "progress": {
    "status": "static",
    "static_completed": 46,
    "total_static": 50,
    "completion_percentage": 92.0,
    "current_difficulty": "easy",
    "ai_questions_answered": 0,
    "ai_questions_correct": 0
  }
}
```

#### Get Progress
```http
GET /api/quizzes/adaptive/progress/?subject=physics&class_level=9
Authorization: Token <token>
```

**Response:**
```json
{
  "exists": true,
  "progress": {
    "status": "ai_active",
    "static_completed": 46,
    "total_static": 50,
    "completion_percentage": 92.0,
    "current_difficulty": "medium",
    "ai_questions_answered": 12,
    "ai_questions_correct": 10,
    "started_at": "2025-01-01T10:00:00Z",
    "last_activity": "2025-01-01T11:30:00Z",
    "finished_at": null
  }
}
```

## Flow Diagram

```
User starts quiz
       ↓
[Initialize Session]
       ↓
   Get next question
       ↓
   ┌─────────────────┐
   │ < 90% complete? │
   └─────────────────┘
       ↓ YES              ↓ NO
[Static Question]    [Check AI Questions]
       ↓                   ↓
[Submit Answer]      [AI Question Available?]
       ↓                   ↓ YES        ↓ NO
[Update Progress]    [Return AI Q]  [Generate 6 AI Qs]
       ↓                   ↓              ↓
[Award Points]       [Submit Answer] [Return First Q]
       ↓                   ↓              ↓
   Repeat            [Update Progress] [Submit Answer]
                           ↓              ↓
                     [Award Points]  [Update Progress]
                           ↓              ↓
                     [Adjust Difficulty] [Adjust Difficulty]
                           ↓              ↓
                     [Generate More?] [Generate More?]
                           ↓              ↓
                     [If < 6 unanswered, generate 6 more]
                           ↓
                        Repeat
```

## Difficulty Progression

### Adjustment Rules
- **Increase Difficulty**: If accuracy ≥ 80% over last 10 questions
  - easy → medium
  - medium → hard
  
- **Decrease Difficulty**: If accuracy < 50% over last 10 questions
  - hard → medium
  - medium → easy

### Points System
- Static question correct: **+10 points**
- AI question correct: **+15 points**

## Testing

### Run Test Script
```bash
cd backend
python test_adaptive_quiz.py
```

### Test Results
```
✅ Progress tracking works
✅ 90% threshold triggers AI generation
✅ AI generates 6 questions in batch
✅ Continuous generation maintains 6 unanswered questions
✅ Difficulty adjustment based on performance
```

## Database Migrations

Applied migrations:
- `accounts/0009_user_static_question_status_and_more.py`
- `quizzes/0007_alter_analytics_id_alter_quiz_id_and_more.py`

## Frontend Integration (Next Steps)

### 1. Create Adaptive Quiz Component
- Use `/api/quizzes/adaptive/start/` to initialize
- Use `/api/quizzes/adaptive/next/` to get questions
- Use `/api/quizzes/adaptive/submit/` to submit answers
- Show progress indicator with completion percentage
- Display "AI Questions Active" badge when status = 'ai_active'
- Show current difficulty level

### 2. Update Quiz Selection Page
- Add "Adaptive Mode" toggle
- Show existing progress if available
- Allow continuing from where user left off

### 3. Progress Tracking UI
- Show completion bar: "45/50 questions (90%)"
- Display status: "Static Questions" or "AI Questions Active"
- Show difficulty level with color coding
- Display AI questions answered count

## Key Features

✅ **Seamless Transition**: Automatic switch from static to AI questions at 90%
✅ **Continuous Generation**: Always maintains 6 unanswered AI questions
✅ **Adaptive Difficulty**: Adjusts based on user performance
✅ **Progress Tracking**: Complete history per subject/class
✅ **Batch Generation**: Efficient 6-question batches
✅ **Multi-Key Rotation**: Uses 8 Gemini API keys for quota management
✅ **Hybrid AI Service**: Ollama + Gemini fallback support

## Configuration

### AI Provider Settings
Admin can control AI provider at `/admin/ai-settings`:
- **Gemini Only**: Use only Gemini API
- **Ollama Only**: Use only Ollama server
- **Auto**: Try Ollama first, fallback to Gemini

### Question Types Supported
- MCQ (Multiple Choice)
- Short Answer
- Long Answer

## Troubleshooting

### No AI Questions Generated
- Check API key manager initialization
- Verify Gemini API keys are valid
- Check quota limits
- Review logs for generation errors

### Difficulty Not Adjusting
- Ensure at least 5 AI questions answered
- Check accuracy calculation in logs
- Verify `update_difficulty_based_on_performance()` is called

### Progress Not Updating
- Verify `update_progress()` is called after each answer
- Check database constraints
- Review progress status transitions

## Future Enhancements

- [ ] Background task for pre-generation (Celery)
- [ ] Question difficulty prediction using ML
- [ ] Personalized question topics based on weak areas
- [ ] Spaced repetition algorithm
- [ ] Question quality feedback system
- [ ] Multi-subject adaptive quizzes
- [ ] Collaborative filtering for question recommendations

## Status: ✅ COMPLETE

All backend components implemented and tested successfully.
Ready for frontend integration.
