# 🎙️ AI Voice Conversation System - Complete Setup Guide

## ✅ Backend Implementation Status

### Database Models (✓ COMPLETE)

- ✅ `VoiceConversationSession` - Main session manager
- ✅ `VoiceConversationMessage` - Individual messages with audio/transcript
- ✅ `VoiceQuizSession` - Quiz-specific sessions
- ✅ `VoiceQuizQuestion` - Quiz questions with MCQ support
- ✅ `VoiceQuizAnswer` - User answers with AI evaluation
- ✅ `ConversationSummary` - Auto-generated session summaries

### API Endpoints (✓ COMPLETE)

```
POST   /api/ai/voice-conversation/start/        - Start new session
POST   /api/ai/voice-conversation/message/      - Send message to AI
POST   /api/ai/voice-conversation/end/          - End session & generate summary
GET    /api/ai/voice-conversation/history/      - Get past sessions
GET    /api/ai/voice-conversation/<id>/         - Get session details
POST   /api/ai/voice-quiz/start/                - Start quiz session
POST   /api/ai/voice-quiz/answer/               - Submit quiz answer
GET    /api/ai/voice-quiz/<id>/results/         - Get quiz results
```

### AI Provider Configuration

The system uses multi-provider AI routing with fallback chain:

- **Primary:** Google Gemini 2.5 Flash (Best for voice)
- **Fallback 1:** Groq API
- **Fallback 2:** Alibaba DashScope Qwen
- **Fallback 3:** Ollama (Self-hosted)

## 🔑 Required API Keys

### 1. Google Gemini API Key (PRIMARY)

**Status:** ✅ Already configured in your project

Get your key:

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create new API key for "MedhaBangla"
4. Copy the key

### 2. Optional: Groq API Key (FALLBACK)

**Status:** ✓ Optional but recommended for reliability

Get your key:

1. Go to [Groq Console](https://console.groq.com)
2. Sign up/Log in
3. Copy your API key under Settings/API Keys

### 3. Optional: ElevenLabs API Key (for high-quality voice synthesis)

**Status:** ✓ Optional for premium voice quality

Get your key:

1. Go to [ElevenLabs](https://elevenlabs.io)
2. Sign up and create account
3. Copy API key from settings

## 🚀 Setup Steps

### Step 1: Add API Keys via Django Admin

1. Start server: `python manage.py runserver`
2. Go to http://localhost:8000/admin
3. Navigate to **AI Provider Settings**
4. Update:
   - `voice_ai_provider` = 'auto' (or 'gemini' for primary)
   - `gemini_api_key` = Your Gemini API key
   - `groq_api_key` = Your Groq API key (optional)
   - `elevenlabs_api_key` = Your ElevenLabs key (optional)
5. Save

### Step 2: Verify Backend Configuration

```bash
# Run tests to verify setup
python manage.py shell

# Then in Python:
from ai.models import AIProviderSettings
from ai.ai_service import get_ai_service

# Check settings
settings = AIProviderSettings.get_settings()
print(f"Voice AI Provider: {settings.voice_ai_provider}")
print(f"Gemini Key configured: {bool(settings.gemini_api_key)}")

# Test AI service
service = get_ai_service('voice_ai_provider')
print(f"Service ready: {service is not None}")
```

### Step 3: Frontend Integration

The React component `VoiceConversationHub.tsx` is ready at:

```
frontend/medhabangla/src/pages/VoiceConversationHub.tsx
```

Update your `App.tsx` to add the route:

```typescript
import VoiceConversationHub from './pages/VoiceConversationHub';

// In your routes:
<Route path="/voice-conversation" element={<VoiceConversationHub />} />
```

### Step 4: Add Navigation Link

Update your Dashboard or Navbar:

```typescript
<Link to="/voice-conversation" className="btn-primary">
  🎙️ Voice Conversation
</Link>
```

## 📱 Feature Overview

### Mode 1: AI Tutor Mode (🧑‍🏫)

StudentAsks doubts and gets detailed explanations

- **Input:** Voice or text question
- **AI Response:** Tutor-like explanation with examples
- **Output:** Text + Optional Voice response

### Mode 2: Exam Mode (📝)

Take voice-based exams with AI grading

- **Input:** AI generates exam questions
- **Response:** Answer in voice or text
- **Evaluation:** AI grades and provides feedback

### Mode 3: Quiz Mode (🧠)

Practice quizzes with instant feedback

- **Input:** select topics/difficulty
- **Response:** MCQ or short answer
- **Scoring:** Real-time score tracking + weak/strong area analysis

### Mode 4: General Chat (💬)

Casual conversation for learning

- **Input:** Any question or topic
- **Response:** Informative AI responses
- **Context:** Auto-retrieval of past session summaries

## 🧪 Testing the Feature

### Test 1: Direct API Testing with cURL

**Start a voice session:**

```bash
curl -X POST http://localhost:8000/api/ai/voice-conversation/start/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "tutor",
    "subject": "Mathematics",
    "topic": "Algebra"
  }'
```

**Response:**

```json
{
  "id": 1,
  "session_id": "uuid-string",
  "mode": "tutor",
  "subject": "Mathematics",
  "topic": "Algebra",
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Send a message:**

```bash
curl -X POST http://localhost:8000/api/ai/voice-conversation/message/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "message_text": "How do I solve quadratic equations?",
    "transcript": "How do I solve quadratic equations?"
  }'
```

**End session:**

```bash
curl -X POST http://localhost:8000/api/ai/voice-conversation/end/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id"
  }'
```

### Test 2: Voice ConversationHub UI Testing

1. **Open the UI:** http://localhost:3000/voice-conversation
2. **Select Mode:** Choose "AI Tutor"
3. **Enter Subject:** "Mathematics"
4. **Enter Topic:** "Functions" (optional)
5. **Click Start**
6. **Test Voice Input:** Hold 🎤 button and speak
7. **Or Type:** Type your doubt in the text field
8. **Send Message:** Click Send button
9. **Verify AI Response:** Check if AI responds within 5 seconds
10. **End Session:** Click "End Session" button
11. **Verify Summary:** Check if summary is stored

### Test 3: Quiz Mode Testing

1. Select "Quiz Mode" from the UI
2. Enter subject: "Physics"
3. Start session
4. System generates quiz questions
5. Answer via voice or text
6. System scores each answer
7. View results with performance analysis

## 📊 Database Schema

### VoiceConversationSession

- `user_id` - Link to User
- `session_id` - Unique session identifier
- `mode` - tutor/exam/quiz/general
- `subject` - Subject being studied
- `topic` - Specific topic
- `conversation_summary` - AI-generated summary
- `score_percentage` - For quiz/exam modes

### VoiceConversationMessage

- `session_id` - Link to Session
- `message_text` - The actual message
- `message_type` - question/answer/explanation/etc
- `is_user_message` - Boolean true if from user
- `audio_url` - Link to audio file (if recorded)
- `transcript` - Transcription of voice
- `ai_response` - AI's response to this message
- `confidence_score` - AI confidence (0-1)
- `is_correct` - For quiz answers
- `timestamp` - When message was created

### VoiceQuizSession

- `user_id` - Link to User
- `quiz_type` - practice/exam/adaptive
- `subject` - Subject of quiz
- `total_questions` - Number of questions
- `correct_answers` - Count ofcorrect responses
- `score_percentage` - Total score
- `performance_analysis` - AI analysis
- `weak_areas` - JSON list of weak topics
- `strong_areas` - JSON list of strong topics

### ConversationSummary

- `user_id` - Link to User
- `voice_session_id` - Link to Session
- `summary_text` - AI-generated summary
- `key_concepts` - JSON list of key points
- `weak_concepts` - JSON list of weak areas
- `strong_concepts` - JSON list of strong areas
- `study_recommendations` - AI recommendations

## 🐛 Troubleshooting

### Issue: "API Key not configured"

**Solution:**

1. Check Django Admin → AI Provider Settings
2. Verify `voice_ai_provider` is set to 'auto' or 'gemini'
3. Verify `gemini_api_key` is not empty
4. Restart Django server after adding keys

### Issue: "Voice recording not working"

**Solution:**

1. Check browser console for errors
2. Ensure HTTPS (required for browser microphone access) or localhost
3. Browser may need microphone permission
4. Try different browser if issue persists

### Issue: "AI response taking too long"

**Solution:**

1. Check network connection
2. Verify API key is valid
3. Try text instead of voice first
4. Check if Groq fallback is working (network latency issue)

### Issue: "Audio playback not working"

**Solution:**

1. Ensure browser supports HTML5 Audio
2. Check browser console for CORS errors
3. Verify audio files are accessible (not blocked by firewall)
4. Try disabling browser extensions (they may block audio)

## 🎯 Next Steps

1. **Frontend Deployment:** Build and deploy React app
2. **Production Database:** Migrate to PostgreSQL for production
3. **Storage:** Set up cloud storage (AWS S3) for audio files
4. **Monitoring:** Add system monitoring for API latency
5. **User Testing:** Beta test with actual students
6. **Analytics:** Track engagement and learning outcomes

## 📝 API Response Examples

### Successful Message Response

```json
{
  "id": 5,
  "message": {
    "id": 5,
    "session_id": 1,
    "message_text": "What is calculus?",
    "message_type": "question",
    "is_user_message": true,
    "ai_response": "Calculus is a branch of mathematics...",
    "confidence_score": 0.95,
    "timestamp": "2025-01-15T10:35:22Z"
  }
}
```

### Quiz Question Response

```json
{
  "id": 1,
  "question_number": 1,
  "question_text": "What is the derivative of x²?",
  "question_type": "short",
  "option_a": "2x",
  "option_b": "x",
  "option_c": "2",
  "option_d": "x²",
  "correct_option": "A"
}
```

### Session Summary Response

```json
{
  "id": 1,
  "summary_text": "Today you learned about quadratic equations...",
  "key_concepts": ["Quadratic formula", "Factoring", "Completing the square"],
  "weak_concepts": ["Complex roots"],
  "strong_concepts": ["Basic solving"],
  "study_recommendations": "Practice more on complex numbers..."
}
```

## ✨ Features Implemented

- ✅ Multi-mode AI conversation (tutor/exam/quiz/general)
- ✅ Voice input with Web Speech API
- ✅ Text input with auto-transcript
- ✅ AI response generation with GPT
- ✅ Real-time scoring for quizzes
- ✅ Auto-summarization of sessions
- ✅ Past session context retrieval
- ✅ Performance analysis & recommendations
- ✅ Weak/strong area tracking
- ✅ Multi-provider AI routing with fallback
- ✅ User authentication & authorization
- ✅ Session history retrieval
- ✅ Beautiful React UI with Tailwind CSS

## 📖 Documentation Files

- `VOICE_CONVERSATION_API.md` - Detailed API documentation
- `VOICE_QUIZ_INTEGRATION.md` - Quiz system integration guide
- `AI_VOICE_TUTOR_GUIDE.md` - Tutor mode detailed guide
- `VOICE_TROUBLESHOOTING.md` - Troubleshooting and common issues

---

**Status:** ✅ Complete and Ready to Use

**Last Updated:** January 15, 2025

**Contact:** For support, file an issue in the repository
