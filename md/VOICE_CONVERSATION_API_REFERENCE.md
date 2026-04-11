# 🎙️ AI Voice Conversation API Reference

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Token YOUR_AUTH_TOKEN
```

Get your token:

```bash
# Create account via registration
# Or login and get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -d "username=your_username&password=your_password"
```

---

## 1. Start Voice Conversation

### Endpoint

```
POST /api/ai/voice-conversation/start/
```

### Request

```json
{
  "mode": "tutor", // tutor | exam | quiz | general
  "subject": "Mathematics", // Required
  "topic": "Algebra" // Optional
}
```

### Response (200 OK)

```json
{
  "id": 1,
  "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e",
  "mode": "tutor",
  "subject": "Mathematics",
  "topic": "Algebra",
  "is_active": true,
  "started_at": "2025-01-15T10:30:00Z",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/ai/voice-conversation/start/ \
  -H "Authorization: Token abc123token" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "tutor",
    "subject": "Physics",
    "topic": "Newton Laws"
  }'
```

---

## 2. Send Message/Question

### Endpoint

```
POST /api/ai/voice-conversation/message/
```

### Request

```json
{
  "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e",
  "message_text": "How do quadratic equations work?",
  "transcript": "How do quadratic equations work?", // Optional
  "audio_url": "https://s3.amazonaws.com/audio.wav" // Optional
}
```

### Response (200 OK)

```json
{
  "id": 1,
  "session_id": 1,
  "message": {
    "id": 5,
    "session": 1,
    "message_text": "How do quadratic equations work?",
    "message_type": "question",
    "is_user_message": true,
    "ai_response": "Quadratic equations are polynomial equations of degree 2...",
    "confidence_score": 0.95,
    "timestamp": "2025-01-15T10:35:22Z"
  }
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/ai/voice-conversation/message/ \
  -H "Authorization: Token abc123token" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e",
    "message_text": "Explain the quadratic formula",
    "transcript": "Explain the quadratic formula"
  }'
```

---

## 3. End Conversation Session

### Endpoint

```
POST /api/ai/voice-conversation/end/
```

### Request

```json
{
  "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e"
}
```

### Response (200 OK)

```json
{
  "id": 1,
  "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e",
  "summary": {
    "id": 1,
    "summary_text": "In this session, you learned about...",
    "key_concepts": [
      "Quadratic equations",
      "Quadratic formula",
      "Discriminant"
    ],
    "weak_concepts": ["Complex roots"],
    "strong_concepts": ["Basic solving"],
    "study_recommendations": "Practice more on...",
    "created_at": "2025-01-15T10:40:00Z"
  }
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/ai/voice-conversation/end/ \
  -H "Authorization: Token abc123token" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e"
  }'
```

---

## 4. Get Session History

### Endpoint

```
GET /api/ai/voice-conversation/history/
```

### Query Parameters

```
subject=Mathematics  // Optional filter by subject
```

### Response (200 OK)

```json
[
  {
    "id": 1,
    "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e",
    "mode": "tutor",
    "subject": "Mathematics",
    "topic": "Algebra",
    "conversation_summary": "Session summary...",
    "score_percentage": 0.0,
    "started_at": "2025-01-15T10:30:00Z",
    "ended_at": "2025-01-15T10:40:00Z"
  }
]
```

### Example

```bash
curl -X GET "http://localhost:8000/api/ai/voice-conversation/history/?subject=Mathematics" \
  -H "Authorization: Token abc123token"
```

---

## 5. Get Session Details

### Endpoint

```
GET /api/ai/voice-conversation/<session_id>/
```

### Response (200 OK)

```json
{
  "id": 1,
  "session_id": "9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e",
  "mode": "tutor",
  "subject": "Mathematics",
  "topic": "Algebra",
  "messages": [
    {
      "id": 1,
      "message_text": "How do quadratic equations work?",
      "is_user_message": true,
      "ai_response": "Quadratic equations are...",
      "timestamp": "2025-01-15T10:35:22Z"
    }
  ],
  "summary": {
    "summary_text": "Session summary...",
    "key_concepts": ["Equations", "Algebra"]
  }
}
```

### Example

```bash
curl -X GET http://localhost:8000/api/ai/voice-conversation/9b3ac4e1-8c2b-4f1d-a5e2-3f9d8c7b1a2e/ \
  -H "Authorization: Token abc123token"
```

---

## 6. Start Voice Quiz

### Endpoint

```
POST /api/ai/voice-quiz/start/
```

### Request

```json
{
  "quiz_type": "practice", // practice | exam | adaptive | custom
  "subject": "Physics",
  "topic": "Forces",
  "class_level": 10, // Grade/class of student
  "difficulty": "medium", // easy | medium | hard
  "num_questions": 5 // Number of questions to generate
}
```

### Response (200 OK)

```json
{
  "id": 1,
  "quiz_type": "practice",
  "subject": "Physics",
  "total_questions": 5,
  "questions": [
    {
      "id": 1,
      "question_number": 1,
      "question_text": "What is Newton's first law?",
      "question_type": "short",
      "option_a": "Objects at rest...",
      "option_b": "Force equals mass...",
      "option_c": "Action and reaction...",
      "option_d": "Energy is conserved...",
      "correct_option": "A"
    }
  ]
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/ai/voice-quiz/start/ \
  -H "Authorization: Token abc123token" \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_type": "practice",
    "subject": "Physics",
    "topic": "Forces",
    "class_level": 10,
    "difficulty": "medium",
    "num_questions": 5
  }'
```

---

## 7. Submit Quiz Answer

### Endpoint

```
POST /api/ai/voice-quiz/answer/
```

### Request

```json
{
  "quiz_question_id": 1,
  "answer_text": "Objects at rest tend to stay at rest",
  "answer_type": "typed", // typed | spoken | selected
  "transcript": "Objects at rest...",
  "time_taken_seconds": 30
}
```

### Response (200 OK)

```json
{
  "id": 1,
  "quiz_question_id": 1,
  "answer_text": "Objects at rest...",
  "is_correct": true,
  "score_points": 10,
  "ai_evaluation": "Correct! Newton's first law states...",
  "confidence_score": 0.98,
  "answered_at": "2025-01-15T10:45:00Z"
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/ai/voice-quiz/answer/ \
  -H "Authorization: Token abc123token" \
  -H "Content-Type: application/json" \
  -d '{
    "quiz_question_id": 1,
    "answer_text": "Objects at rest tend to stay at rest",
    "answer_type": "typed",
    "time_taken_seconds": 30
  }'
```

---

## 8. Get Quiz Results

### Endpoint

```
GET /api/ai/voice-quiz/<quiz_id>/results/
```

### Response (200 OK)

```json
{
  "id": 1,
  "quiz_type": "practice",
  "subject": "Physics",
  "total_questions": 5,
  "questions_answered": 5,
  "correct_answers": 4,
  "score_percentage": 80.0,
  "performance_analysis": "You performed well on...",
  "weak_areas": ["Circular motion"],
  "strong_areas": ["Linear motion", "Newton's laws"],
  "time_spent_seconds": 300,
  "is_completed": true
}
```

### Example

```bash
curl -X GET http://localhost:8000/api/ai/voice-quiz/1/results/ \
  -H "Authorization: Token abc123token"
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid session_id",
  "details": "Session not found or already ended"
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to access this resource"
}
```

### 500 Internal Server Error

```json
{
  "error": "Something went wrong",
  "details": "AI provider temporarily unavailable"
}
```

---

## Testing Workflow

### Complete Tutor Session Flow

```bash
# 1. Start session
START_RESPONSE=$(curl -s -X POST http://localhost:8000/api/ai/voice-conversation/start/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"tutor","subject":"Mathematics","topic":"Algebra"}')
SESSION_ID=$(echo $START_RESPONSE | jq -r '.session_id')

# 2. Ask question 1
curl -s -X POST http://localhost:8000/api/ai/voice-conversation/message/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"message_text\":\"What is a quadratic equation?\"}"

# 3. Ask question 2
curl -s -X POST http://localhost:8000/api/ai/voice-conversation/message/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\",\"message_text\":\"How do I solve it?\"}"

# 4. End session
curl -s -X POST http://localhost:8000/api/ai/voice-conversation/end/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"$SESSION_ID\"}"

# 5. Get history
curl -s -X GET http://localhost:8000/api/ai/voice-conversation/history/ \
  -H "Authorization: Token YOUR_TOKEN"

# 6. Get session details
curl -s -X GET http://localhost:8000/api/ai/voice-conversation/$SESSION_ID/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### Complete Quiz Flow

```bash
# 1. Start quiz
QUIZ_RESPONSE=$(curl -s -X POST http://localhost:8000/api/ai/voice-quiz/start/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quiz_type":"practice","subject":"Physics","topic":"Forces","class_level":10,"difficulty":"medium","num_questions":3}')
QUIZ_ID=$(echo $QUIZ_RESPONSE | jq -r '.id')
QUESTION_ID=$(echo $QUIZ_RESPONSE | jq -r '.questions[0].id')

# 2. Answer question 1
curl -s -X POST http://localhost:8000/api/ai/voice-quiz/answer/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"quiz_question_id\":$QUESTION_ID,\"answer_text\":\"Newtons first law\",\"answer_type\":\"typed\",\"time_taken_seconds\":30}"

# 3. Get results
curl -s -X GET http://localhost:8000/api/ai/voice-quiz/$QUIZ_ID/results/ \
  -H "Authorization: Token YOUR_TOKEN"
```

---

## Rate Limiting

- Default: 100 requests per hour per user
- Quiz API: 50 requests per hour
- Message API: 30 requests per minute

---

## Response Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created              |
| 400  | Bad Request - Invalid parameters        |
| 401  | Unauthorized - Authentication required  |
| 403  | Forbidden - Permission denied           |
| 404  | Not Found - Resource not found          |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Server Error - Internal error           |

---

## Best Practices

1. **Always include session_id** - Use the same session_id for all messages in a session
2. **Include timestamps** - Add timestamps to track conversation flow
3. **Provide transcripts** - Even if you have audio, provide text transcripts for better AI understanding
4. **Use appropriate modes** - Select mode beforehand (tutor/exam/quiz)
5. **Handle errors gracefully** - Implement retry logic with exponential backoff
6. **Cache responses** - Cache session history to reduce API calls
7. **Validate inputs** - Always validate user input before sending to API

---

## Common Use Cases

### 1: Student Asks Doubt

```bash
POST /message/
{
  "message_text": "I don't understand photosynthesis",
  "session_id": "xyz"
}
```

### 2: Exam Preparation

```bash
POST /quiz/start/
{
  "quiz_type": "exam",
  "subject": "Biology",
  "num_questions": 10,
  "difficulty": "hard"
}
```

### 3: Daily Practice

```bash
POST /quiz/start/
{
  "quiz_type": "practice",
  "subject": "Mathematics",
  "num_questions": 5,
  "difficulty": "medium"
}
```

#### 4: Review Past Session

```bash
GET /history/?subject=Physics
```

---

**Last Updated:** January 15, 2025
**Version:** 1.0
**Maintained by:** MedhaBangla Team
