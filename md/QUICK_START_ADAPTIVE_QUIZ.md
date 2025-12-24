# 🚀 Quick Start Guide - Adaptive Quiz System

## For Users (Students)

### How to Use Adaptive Quiz

1. **Navigate to Quiz Selection**
   - Go to `/quiz/select` or click "Quiz" from dashboard

2. **Select Your Subject**
   - Choose ONE subject (e.g., Physics, Chemistry, Math)
   - Adaptive mode works best with a single subject

3. **Enable Adaptive Mode**
   - Look for the purple "🤖 Adaptive Quiz Mode" card
   - Toggle the switch to **ON**
   - You'll see a note explaining the feature

4. **Select Question Type**
   - Choose MCQ (recommended for best experience)
   - Or select Short/Long answer if preferred

5. **Start Quiz**
   - Click "Start Quiz →" button
   - You'll be taken to the adaptive quiz interface

6. **Answer Questions**
   - Start with static questions from database
   - Watch your progress bar fill up
   - See completion percentage in real-time

7. **Experience AI Activation**
   - At 90% completion, AI questions activate
   - Badge changes to "🤖 AI Question"
   - Questions become personalized to your level

8. **Watch Difficulty Adjust**
   - If you're doing well (≥80%), difficulty increases
   - If struggling (<50%), difficulty decreases
   - System adapts to your performance

9. **Continue Learning**
   - AI generates 6 questions ahead continuously
   - Keep answering to improve your skills
   - Earn 15 points per correct AI question (vs 10 for static)

---

## For Developers

### Backend Setup

1. **Migrations Already Applied**
   ```bash
   # Already done, but if needed:
   cd backend
   python manage.py migrate
   ```

2. **Test the System**
   ```bash
   cd backend
   python test_adaptive_quiz.py
   ```
   
   Expected output:
   ```
   ✅ ADAPTIVE QUIZ SYSTEM TEST COMPLETE
   Total AI questions generated: 10
   Progress status: ai_active
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   python manage.py runserver
   ```

### Frontend Setup

1. **Install Dependencies** (if not already done)
   ```bash
   cd frontend/medhabangla
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access Application**
   - Open browser: `http://localhost:5173`
   - Login with your account
   - Navigate to Quiz Selection

---

## API Testing (Optional)

### Test with cURL

1. **Start Quiz Session**
   ```bash
   curl -X POST http://localhost:8000/api/quizzes/adaptive/start/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"subject": "physics", "class_level": 9, "question_type": "mcq"}'
   ```

2. **Get Next Question**
   ```bash
   curl -X POST http://localhost:8000/api/quizzes/adaptive/next/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"subject": "physics", "class_level": 9, "question_type": "mcq"}'
   ```

3. **Submit Answer**
   ```bash
   curl -X POST http://localhost:8000/api/quizzes/adaptive/submit/ \
     -H "Authorization: Token YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "question_id": 123,
       "answer": "Option A",
       "source": "static",
       "subject": "physics",
       "class_level": 9
     }'
   ```

4. **Get Progress**
   ```bash
   curl http://localhost:8000/api/quizzes/adaptive/progress/?subject=physics&class_level=9 \
     -H "Authorization: Token YOUR_TOKEN"
   ```

---

## Troubleshooting

### Issue: No AI Questions Generated

**Solution:**
1. Check Gemini API keys in `.env`
2. Verify API key manager initialization:
   ```bash
   cd backend
   python -c "from ai.question_generator import get_question_generator; g = get_question_generator(); print('OK')"
   ```
3. Check logs for API errors

### Issue: Difficulty Not Adjusting

**Solution:**
1. Answer at least 5 AI questions
2. Check accuracy (must be >80% or <50% to trigger)
3. Review logs: `[QuestionGenerator] Recent accuracy: X%`

### Issue: Progress Not Updating

**Solution:**
1. Check database migrations are applied
2. Verify progress tracker exists:
   ```bash
   python manage.py shell
   >>> from quizzes.models import UserQuizProgress
   >>> UserQuizProgress.objects.all()
   ```
3. Check API response for progress object

### Issue: Frontend Not Loading

**Solution:**
1. Check browser console for errors
2. Verify backend is running on port 8000
3. Check API proxy configuration in `vite.config.ts`
4. Clear browser cache and reload

---

## Quick Verification Checklist

### Backend ✅
- [ ] Migrations applied
- [ ] Test script passes
- [ ] Server running on port 8000
- [ ] API endpoints responding
- [ ] Gemini API keys configured

### Frontend ✅
- [ ] Dependencies installed
- [ ] Dev server running on port 5173
- [ ] AdaptiveQuiz route accessible
- [ ] Toggle switch working
- [ ] No console errors

### Database ✅
- [ ] UserQuizProgress table exists
- [ ] AIGeneratedQuestion table exists
- [ ] User fields updated
- [ ] Test data available

---

## Expected Behavior

### First Time User
1. Selects subject → Enables adaptive mode
2. Starts quiz → Sees static questions
3. Answers 45/50 questions (90%)
4. Next question → AI generates 6 questions
5. Sees "🤖 AI Question" badge
6. Difficulty starts at "Easy"
7. Continues answering → Difficulty adjusts
8. More questions generate automatically

### Returning User
1. Progress is saved per subject
2. Can continue from where they left off
3. AI questions remain available
4. Difficulty level is remembered

---

## Performance Tips

### For Best Experience
- Use MCQ question type (fastest)
- Stable internet connection for AI generation
- Modern browser (Chrome, Firefox, Edge)
- Enable JavaScript

### For Admins
- Monitor API quota usage
- Check generation logs regularly
- Review user progress statistics
- Ensure database backups

---

## Support Resources

1. **Complete Documentation**: `ADAPTIVE_QUIZ_SYSTEM.md`
2. **Implementation Details**: `IMPLEMENTATION_COMPLETE.md`
3. **Test Script**: `backend/test_adaptive_quiz.py`
4. **API Endpoints**: `backend/quizzes/urls.py`

---

## Success Indicators

✅ User can enable adaptive mode
✅ Static questions load correctly
✅ Progress bar updates in real-time
✅ AI activates at 90% completion
✅ Questions generate automatically
✅ Difficulty adjusts based on performance
✅ Points are awarded correctly
✅ Progress is saved and persistent

---

## Next Steps

1. **Test the system** with real users
2. **Monitor performance** and API usage
3. **Gather feedback** on difficulty progression
4. **Optimize** question generation prompts
5. **Add analytics** for admin dashboard

---

**Status:** ✅ Ready to Use
**Last Updated:** December 24, 2025
**Version:** 1.0.0
