# MedhaBangla API Documentation

## Overview

This document provides documentation for the MedhaBangla REST API, which powers the educational platform for Bangladeshi students.

## Authentication

Most endpoints require authentication via JWT tokens. To authenticate, first obtain a token by logging in:

```
POST /api/accounts/login/
Content-Type: application/json

{
  "username": "student1",
  "password": "studentpass123"
}
```

Response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "student1",
    "email": "student1@example.com",
    "class_level": 9,
    "fav_subjects": ["math", "physics"],
    "disliked_subjects": ["english"],
    "total_points": 1250,
    "is_teacher": false,
    "is_admin": false
  }
}
```

Include the token in subsequent requests:
```
Authorization: Token eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## Accounts

### Register a New User
```
POST /api/accounts/register/
Content-Type: application/json

{
  "username": "newstudent",
  "email": "newstudent@example.com",
  "password": "securepassword123",
  "class_level": 9,
  "fav_subjects": ["math", "physics"],
  "disliked_subjects": ["english"]
}
```

### Login
```
POST /api/accounts/login/
Content-Type: application/json

{
  "username": "student1",
  "password": "studentpass123"
}
```

### Get User Profile
```
GET /api/accounts/profile/
Authorization: Token <token>
```

### Update User Profile
```
PUT /api/accounts/profile/
Authorization: Token <token>
Content-Type: application/json

{
  "class_level": 10,
  "fav_subjects": ["biology", "chemistry"],
  "disliked_subjects": ["math"]
}
```

### List All Users (Admin Only)
```
GET /api/accounts/users/
Authorization: Token <admin_token>
```

## Quizzes

### List Quizzes (Filtered by User's Class)
```
GET /api/quizzes/quizzes/
Authorization: Token <token>
```

### Get Specific Quiz
```
GET /api/quizzes/quizzes/{id}/
Authorization: Token <token>
```

### Create Quiz (Teacher Only)
```
POST /api/quizzes/quizzes/
Authorization: Token <teacher_token>
Content-Type: application/json

{
  "subject": "math",
  "class_target": 9,
  "difficulty": "medium",
  "question_text": "What is the value of π (pi) approximately?",
  "options": {
    "A": "3.14",
    "B": "2.71",
    "C": "1.41",
    "D": "1.73"
  },
  "correct_answer": "A",
  "explanation": "Pi (π) is a mathematical constant approximately equal to 3.14159."
}
```

### Update Quiz (Teacher Only)
```
PUT /api/quizzes/quizzes/{id}/
Authorization: Token <teacher_token>
Content-Type: application/json

{
  "subject": "math",
  "class_target": 9,
  "difficulty": "hard",
  "question_text": "What is the value of π (pi) approximately?",
  "options": {
    "A": "3.14",
    "B": "2.71",
    "C": "1.41",
    "D": "1.73"
  },
  "correct_answer": "A",
  "explanation": "Pi (π) is a mathematical constant approximately equal to 3.14159."
}
```

### Delete Quiz (Teacher Only)
```
DELETE /api/quizzes/quizzes/{id}/
Authorization: Token <teacher_token>
```

### Submit Quiz Attempt
```
POST /api/quizzes/attempts/
Authorization: Token <token>
Content-Type: application/json

{
  "quiz_id": 1,
  "selected_answer": "A"
}
```

### Get User Analytics
```
GET /api/quizzes/analytics/
Authorization: Token <token>
```

### Submit Quiz Results
```
POST /api/quizzes/submit-results/
Authorization: Token <token>
Content-Type: application/json

{
  "score": 85,
  "mistakes": {
    "1": "B",
    "3": "C"
  }
}
```

## Books

### List Books
```
GET /api/books/books/
Authorization: Token <token>

# With filters
GET /api/books/books/?class_level=9&category=textbook&language=en
```

### Get Specific Book
```
GET /api/books/books/{id}/
Authorization: Token <token>
```

### Create Book (Admin Only)
```
POST /api/books/books/
Authorization: Token <admin_token>
Content-Type: multipart/form-data

title=Mathematics Class 9
author=Dr. Md. Abu Yusuf
class_level=9
category=textbook
language=en
pdf_file=@math_class9.pdf
```

### Update Book (Admin Only)
```
PUT /api/books/books/{id}/
Authorization: Token <admin_token>
Content-Type: multipart/form-data

title=Updated Mathematics Class 9
```

### Delete Book (Admin Only)
```
DELETE /api/books/books/{id}/
Authorization: Token <admin_token>
```

### Set Bookmark
```
POST /api/books/bookmarks/
Authorization: Token <token>
Content-Type: application/json

{
  "book_id": 1,
  "page_number": 42
}
```

### Get User Bookmarks
```
GET /api/books/bookmarks/
Authorization: Token <token>
```

### Delete Bookmark
```
DELETE /api/books/bookmarks/{book_id}/
Authorization: Token <token>
```

## Games

### List Available Games
```
GET /api/games/games/
Authorization: Token <token>
```

### Start Game Session
```
POST /api/games/games/start/
Authorization: Token <token>
Content-Type: application/json

{
  "game_id": 1
}
```

### End Game Session
```
POST /api/games/games/end/
Authorization: Token <token>
Content-Type: application/json

{
  "game_id": 1,
  "score": 1500,
  "duration": 600  # 10 minutes in seconds
}
```

### Get Game Leaderboard
```
GET /api/games/leaderboard/{game_id}/
Authorization: Token <token>
```

## AI

### Start AI Chat Session
```
POST /api/ai/chat/start/
Authorization: Token <token>
```

### Send Message to AI
```
POST /api/ai/chat/message/
Authorization: Token <token>
Content-Type: application/json

{
  "session_id": "uuid-string",
  "message": "Can you explain photosynthesis?",
  "message_type": "general"  # or "remedial" or "note_taking"
}
```

### Get Chat History
```
GET /api/ai/chat/history/{session_id}/
Authorization: Token <token>
```

### Save Offline Note
```
POST /api/ai/notes/save/
Authorization: Token <token>
Content-Type: application/json

{
  "title": "Photosynthesis Notes",
  "content": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
}
```

### List Offline Notes
```
GET /api/ai/notes/list/
Authorization: Token <token>
```

### Get Remedial Learning Explanation
```
POST /api/ai/remedial/
Authorization: Token <token>
Content-Type: application/json

{
  "analytics_id": 1
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 10 requests per second per IP for general endpoints
- 5 requests per second per IP for authentication endpoints

Exceeding these limits will result in a 429 Too Many Requests response.

## Versioning

The API is currently at version 1. All endpoints are prefixed with `/api/v1/`.

## Changelog

### v1.0.0 (Initial Release)
- User authentication and management
- Quiz system with hierarchical organization
- Digital library with book management
- Gamification system with time-gated access
- AI integration with Google Gemini
- Offline notes with IndexedDB storage