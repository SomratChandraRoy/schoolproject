import uuid
import warnings
import json
import re
from django.db.models import Count

# Suppress the deprecation warning before importing
warnings.filterwarnings('ignore', category=FutureWarning)

import google.generativeai as genai
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation
from .serializers import AIChatSessionSerializer, AIChatMessageSerializer, OfflineNoteSerializer, RemedialExplanationSerializer
from .ai_helper import ai_helper
from accounts.models import User, StudySession
from quizzes.models import Quiz, Analytics, QuizAttempt
from quizzes.serializers import QuizSerializer
from quizzes.evaluation import evaluate_quiz_answer, format_answer_for_display, normalize_options


class StartAIChatSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        session_id = str(uuid.uuid4())
        
        session = AIChatSession.objects.create(
            user=user,
            session_id=session_id
        )
        
        serializer = AIChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ListAIChatSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = (
            AIChatSession.objects.filter(user=request.user)
            .annotate(message_count=Count('messages'))
            .order_by('-updated_at')
        )

        payload = []
        for session in sessions:
            first_user_message = (
                AIChatMessage.objects.filter(session=session, is_user_message=True)
                .order_by('timestamp')
                .first()
            )
            last_message = (
                AIChatMessage.objects.filter(session=session)
                .order_by('-timestamp')
                .first()
            )

            title_source = ''
            if first_user_message and first_user_message.message:
                title_source = first_user_message.message
            elif last_message and last_message.message:
                title_source = last_message.message

            title = (title_source or 'New chat').strip()
            if len(title) > 70:
                title = f"{title[:67].rstrip()}..."

            payload.append(
                {
                    'session_id': session.session_id,
                    'title': title,
                    'message_count': session.message_count,
                    'created_at': session.created_at,
                    'updated_at': session.updated_at,
                    'last_message_preview': (
                        (last_message.message[:120] + '...')
                        if last_message and last_message.message and len(last_message.message) > 120
                        else (last_message.message if last_message else '')
                    ),
                }
            )

        return Response(payload)


class DeleteAIChatSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        try:
            session = AIChatSession.objects.get(session_id=session_id, user=request.user)
            session.delete()
            return Response({'status': 'deleted'}, status=status.HTTP_204_NO_CONTENT)
        except AIChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)


class AIChatMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        session_id = request.data.get('session_id')
        message = request.data.get('message')
        message_type = request.data.get('message_type', 'general')

        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not str(message or '').strip():
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = AIChatSession.objects.get(session_id=session_id, user=user)
            
            # Save user message
            user_message = AIChatMessage.objects.create(
                session=session,
                message=message,
                is_user_message=True,
                message_type=message_type
            )
            
            # Get AI response using Hybrid AI Service (Ollama + Gemini fallback)
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            # Customize prompt based on message type
            if message_type == 'homework_help':
                class_info = f"Class {user.class_level}" if user.class_level else "Classes 6-12"
                prompt = f"""আপনি একজন সহায়ক AI শিক্ষক যিনি {class_info} এর শিক্ষার্থীদের হোমওয়ার্কে সাহায্য করেন।

নিয়ম:
- সরাসরি উত্তর দেবেন না, বরং শিক্ষার্থীকে চিন্তা করতে সাহায্য করুন
- ধাপে ধাপে গাইড করুন
- উৎসাহব্যঞ্জক এবং ধৈর্যশীল হন
- বাংলা এবং ইংরেজি উভয় ভাষায় সাহায্য করুন
- NCTB পাঠ্যক্রম অনুসরণ করুন

শিক্ষার্থীর প্রশ্ন: {message}

আপনার উত্তর:"""
            elif message_type == 'exam_prep':
                class_info = f"Class {user.class_level}" if user.class_level else "Classes 6-12"
                prompt = f"""You are an AI exam preparation tutor for {class_info} students in Bangladesh.

Focus on:
- Key concepts and topics for NCTB curriculum
- Common exam patterns
- Time management tips
- Practice strategies
- Stress management
- Memory techniques

Respond in Bangla for better understanding.

Student's question: {message}

Your response:"""
            elif message_type == 'remedial':
                prompt = f"""You are an expert educational AI tutor for Bangladeshi students. 
The student is in Class {user.class_level}. 
Provide a clear explanation in simple terms. Use Bangla when appropriate for better understanding.
Student's question: {message}

Please provide:
1. A clear explanation of the concept
2. An example if applicable
3. Tips to remember this concept"""
            elif message_type == 'note_taking':
                prompt = f"""You are an AI note-taking assistant for students. 
Summarize the following content in a structured, easy-to-study format with bullet points and key concepts highlighted.
Content: {message}"""
            else:  # general
                class_info = f"Class {user.class_level}" if user.class_level else "Classes 6-12"
                prompt = f"""আপনি MedhaBangla এর AI শিক্ষা সহায়ক, যিনি {class_info} এর শিক্ষার্থীদের সাহায্য করেন।

আপনি সাহায্য করতে পারেন:
- পড়াশোনার প্রশ্নে
- হোমওয়ার্কে
- পরীক্ষার প্রস্তুতিতে
- বই এবং অধ্যায় বুঝতে
- পড়ার পরিকল্পনা তৈরিতে

সবসময় উৎসাহব্যঞ্জক, সহায়ক এবং শিক্ষামূলক হন। NCTB পাঠ্যক্রম অনুসরণ করুন।

শিক্ষার্থী: {message}

AI:"""
            
            # Generate AI response using Hybrid AI Service
            success, ai_response, error, source = ai_service.generate(
                prompt,
                timeout=60,
                feature_type='chat_page_provider',
            )
            
            if not success:
                # Fallback to error message
                ai_response = f"দুঃখিত, AI সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\n\nError: {error}"
            else:
                print(f"[AIChat] Response from: {source}")
            
            # Save AI message
            ai_message_obj = AIChatMessage.objects.create(
                session=session,
                message=ai_response,
                is_user_message=False,
                message_type=message_type,
                provider_used=source if success else 'none',
            )

            session.save(update_fields=['updated_at'])
            
            return Response({
                'user_message': AIChatMessageSerializer(user_message).data,
                'ai_message': ai_response,
                'ai_message_obj': AIChatMessageSerializer(ai_message_obj).data,
                'provider_used': source if success else 'none',
            })
            
        except AIChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'AI chat error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, session_id):
        try:
            session = AIChatSession.objects.get(session_id=session_id, user=request.user)
            messages = AIChatMessage.objects.filter(session=session).order_by('timestamp')
            serializer = AIChatMessageSerializer(messages, many=True)
            return Response(serializer.data)
        except AIChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)


class SaveOfflineNoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        title = request.data.get('title')
        content = request.data.get('content')
        
        note = OfflineNote.objects.create(
            user=user,
            title=title,
            content=content
        )
        
        serializer = OfflineNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ListOfflineNotesView(generics.ListAPIView):
    serializer_class = OfflineNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return OfflineNote.objects.filter(user=self.request.user).order_by('-created_at')


class RemedialLearningView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        wrong_answers = request.data.get('wrong_answers', [])
        
        try:
            # Prepare mistake analysis prompt for Gemini
            mistake_details = []
            for item in wrong_answers:
                mistake_details.append(f"Question: {item['question']}\nUser Answer: {item['userAnswer']}\nCorrect Answer: {item['correctAnswer']}")
            
            if not mistake_details:
                return Response({'error': 'No mistakes found for analysis'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get AI explanation using the shared AI service
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            prompt = f"""You are an expert educational AI tutor for Bangladeshi students. 
Analyze the following mistakes made by a Class {user.class_level} student and provide remedial guidance.

Mistakes:
{chr(10).join(mistake_details)}

Please provide in Bangla:
1. **ভুল ধারণা চিহ্নিতকরণ** (Identification of misconceptions)
2. **সঠিক ধারণার ব্যাখ্যা** (Clear explanation of correct concepts)
3. **বোঝার জন্য পরীক্ষা** (Three check-for-understanding points)
4. **অনুশীলনের পরামর্শ** (Practice suggestions)

Make your explanation clear, encouraging, and educational."""
            
            success, explanation, error, source = ai_service.generate(prompt, timeout=90)
            if not success:
                return Response({'error': f'Error generating remedial content: {error}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Return the explanation
            return Response({'explanation': explanation})
            
        except Exception as e:
            return Response({'error': f'Error generating remedial content: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateQuizQuestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only teachers and admins can generate questions
        if not (request.user.is_teacher or request.user.is_admin):
            return Response({'error': 'Only teachers and admins can generate questions'}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        subject = request.data.get('subject')
        class_level = request.data.get('class_level')
        difficulty = request.data.get('difficulty', 'medium')
        question_type = request.data.get('question_type', 'mcq')
        
        # Validate required fields
        if not subject or not class_level:
            return Response({'error': 'Subject and class_level are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"[AI Generation] User: {user.username}, Subject: {subject}, Class: {class_level}, Difficulty: {difficulty}, Type: {question_type}")
        
        try:
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            # Create prompt for generating question
            prompt = f"""You are an expert educational content creator for the Bangladeshi education system.
Generate a {difficulty} level {question_type} question for Class {class_level} students in {subject}.

Requirements:
1. The question MUST be curriculum-appropriate for Bangladesh's national curriculum
2. For MCQ questions, provide exactly 4 options (A, B, C, D) with one correct answer
3. For short answer questions, provide a brief model answer
4. For long answer questions, provide a detailed answer outline
5. Include a clear explanation of the concept being tested
6. Use Bangla for subjects where it's more appropriate

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{{
    "question_text": "The question text here",
    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
    "correct_answer": "The correct answer",
    "explanation": "Detailed explanation of the concept"
}}

For non-MCQ questions, set "options" to an empty object {{}}."""
            
            print(f"[AI Generation] Calling shared AI service (Groq first, Gemini fallback)...")

            success, response_text, error_message, source = ai_service.generate(
                prompt=prompt,
                timeout=90,
                model_name='gemini-2.5-flash-lite'
            )
            
            if not success:
                print(f"[AI Generation] ERROR: {error_message}")
                return Response({'error': error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            print(f"[AI Generation] Received response (length: {len(response_text)})")
            
            # Try to parse the response as JSON
            import json
            import re
            
            try:
                # Remove markdown code blocks if present
                if response_text.startswith('```'):
                    response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                question_data = json.loads(response_text)
                print(f"[AI Generation] Successfully parsed JSON")
            except json.JSONDecodeError as je:
                print(f"[AI Generation] JSON decode error: {str(je)}")
                # If JSON parsing fails, try to extract JSON from the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    question_data = json.loads(json_match.group())
                    print(f"[AI Generation] Extracted JSON from response")
                else:
                    print(f"[AI Generation] Could not extract JSON. Response: {response_text[:200]}")
                    raise ValueError("Could not extract valid JSON from AI response")
            
            # Validate question data
            if not question_data.get('question_text'):
                return Response({'error': 'AI response missing question_text'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if not question_data.get('correct_answer'):
                return Response({'error': 'AI response missing correct_answer'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Create the quiz question in the database
            print(f"[AI Generation] Creating quiz in database...")
            quiz_question = Quiz.objects.create(
                subject=subject,
                class_target=class_level,
                difficulty=difficulty,
                question_text=question_data['question_text'],
                question_type=question_type,
                options=question_data.get('options', {}),
                correct_answer=question_data['correct_answer'],
                explanation=question_data.get('explanation', '')
            )
            
            print(f"[AI Generation] Quiz created successfully with ID: {quiz_question.id}")
            
            serializer = QuizSerializer(quiz_question)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            error_message = str(e)
            print(f"[AI Generation] ERROR: {error_message}")
            return Response({'error': f'Error generating question: {error_message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ManageClassQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, class_level, subject):
        # Only teachers and admins can manage questions
        if not (request.user.is_teacher or request.user.is_admin):
            return Response({'error': 'Only teachers and admins can manage questions'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get all questions for a specific class and subject
            questions = Quiz.objects.filter(class_target=class_level, subject=subject).order_by('-created_at')
            serializer = QuizSerializer(questions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': f'Error fetching questions: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, class_level, subject, question_id):
        # Only teachers and admins can delete questions
        if not (request.user.is_teacher or request.user.is_admin):
            return Response({'error': 'Only teachers and admins can delete questions'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Delete a specific question
            question = Quiz.objects.get(id=question_id, class_target=class_level, subject=subject)
            question.delete()
            return Response({'message': 'Question deleted successfully'})
        except Quiz.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'Error deleting question: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class GenerateStudyNotesView(APIView):
    """Generate AI-powered study notes from content"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        content = request.data.get('content')
        subject = request.data.get('subject', 'General')
        note_type = request.data.get('note_type', 'summary')  # summary, flashcard, detailed
        
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            notes = ai_helper.generate_study_notes(
                content=content,
                class_level=user.class_level or 9,
                subject=subject,
                note_type=note_type
            )
            
            return Response({'notes': notes})
        except Exception as e:
            return Response({'error': f'Error generating notes: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateBookSummaryView(APIView):
    """Generate AI summary of a book chapter"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        book_title = request.data.get('book_title')
        chapter = request.data.get('chapter')
        
        if not book_title or not chapter:
            return Response({'error': 'Book title and chapter are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            summary = ai_helper.generate_book_summary(
                book_title=book_title,
                chapter=chapter,
                class_level=user.class_level or 9
            )
            
            return Response({'summary': summary})
        except Exception as e:
            return Response({'error': f'Error generating summary: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateGameHintView(APIView):
    """Generate AI hints for games"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        game_type = request.data.get('game_type')
        difficulty = request.data.get('difficulty', 'medium')
        current_state = request.data.get('current_state', '')
        
        if not game_type:
            return Response({'error': 'Game type is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hint = ai_helper.generate_game_hint(
                game_type=game_type,
                difficulty=difficulty,
                current_state=current_state
            )
            
            return Response({'hint': hint})
        except Exception as e:
            return Response({'error': f'Error generating hint: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnalyzeStudyPatternView(APIView):
    """Analyze student's study pattern and provide recommendations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        try:
            # Get study sessions
            study_sessions = StudySession.objects.filter(user=user).values('subject', 'duration', 'date')
            study_sessions_list = list(study_sessions)
            
            # Get quiz attempts
            quiz_attempts = QuizAttempt.objects.filter(user=user).values('is_correct', 'attempted_at')
            quiz_attempts_list = list(quiz_attempts)
            
            # Generate analysis
            analysis = ai_helper.analyze_study_pattern(
                study_sessions=study_sessions_list,
                quiz_attempts=quiz_attempts_list,
                class_level=user.class_level or 9
            )
            
            return Response(analysis)
        except Exception as e:
            return Response({'error': f'Error analyzing study pattern: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateSyllabusBreakdownView(APIView):
    """Generate detailed breakdown of a syllabus chapter"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        subject = request.data.get('subject')
        chapter = request.data.get('chapter')
        
        if not subject or not chapter:
            return Response({'error': 'Subject and chapter are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            breakdown = ai_helper.generate_syllabus_breakdown(
                subject=subject,
                class_level=user.class_level or 9,
                chapter=chapter
            )
            
            return Response(breakdown)
        except Exception as e:
            return Response({'error': f'Error generating breakdown: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ImprovedRemedialLearningView(APIView):
    """Enhanced remedial learning with AI helper"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        question = request.data.get('question')
        user_answer = request.data.get('user_answer')
        correct_answer = request.data.get('correct_answer')
        subject = request.data.get('subject', 'General')
        
        if not all([question, user_answer, correct_answer]):
            return Response({'error': 'Question, user answer, and correct answer are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            explanation = ai_helper.generate_remedial_explanation(
                question=question,
                user_answer=user_answer,
                correct_answer=correct_answer,
                class_level=user.class_level or 9,
                subject=subject
            )
            
            return Response({'explanation': explanation})
        except Exception as e:
            return Response({'error': f'Error generating explanation: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnalyzeQuizResultsView(APIView):
    """Comprehensive AI analysis of quiz results"""
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def _extract_json_object(raw_text):
        text = str(raw_text or '').strip()
        if not text:
            return None

        if text.startswith('```'):
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                return None

        return None

    def _grade_open_ended_answers_with_ai(self, ai_service, subject, class_level, open_ended_items):
        """Grade short/long answers semantically with AI and return indexed verdicts."""
        if not open_ended_items:
            return {}

        prompt_payload = [
            {
                'index': item['index'],
                'question_type': item['question_type'],
                'question_text': item['question_text'],
                'student_answer': item['user_answer'],
                'reference_answer': item['correct_answer'],
            }
            for item in open_ended_items
        ]

        grading_prompt = f"""You are an expert exam evaluator for Bangladesh curriculum (Class {class_level}, Subject: {subject}).

Evaluate each answer semantically. Do NOT require exact wording.

Rules:
1. Mark correct if the student's meaning is scientifically/academically correct.
2. Accept synonyms, reordered wording, and minor grammar/spelling errors.
3. For short answers: key idea correctness is enough.
4. For long answers: core points must be substantially covered.
5. Return improvement points for each answer, even when correct.

Input JSON:
{json.dumps(prompt_payload, ensure_ascii=False)}

Return ONLY valid JSON object in this format:
{{
  "results": [
    {{
      "index": 0,
      "is_correct": true,
      "semantic_score": 0.82,
      "feedback": "short feedback",
      "improvement_points": ["point 1", "point 2"]
    }}
  ]
}}

semantic_score must be between 0 and 1.
"""

        success, response_text, error, source = ai_service.generate(
            grading_prompt,
            timeout=90,
            feature_type='quiz_flashcard_provider'
        )

        if not success:
            print(f"[Quiz Analysis] AI semantic grading failed: {error}")
            return {}

        print(f"[Quiz Analysis] Semantic grading response from: {source}")

        parsed = self._extract_json_object(response_text)
        if not isinstance(parsed, dict):
            return {}

        raw_results = parsed.get('results', [])
        if not isinstance(raw_results, list):
            return {}

        normalized = {}
        for row in raw_results:
            if not isinstance(row, dict):
                continue

            try:
                index = int(row.get('index'))
            except (TypeError, ValueError):
                continue

            semantic_score = row.get('semantic_score', 0)
            try:
                semantic_score = max(0.0, min(1.0, float(semantic_score)))
            except (TypeError, ValueError):
                semantic_score = 0.0

            feedback = str(row.get('feedback', '') or '').strip()
            improvement_points = row.get('improvement_points', [])

            if isinstance(improvement_points, str):
                improvement_points = [improvement_points]
            elif not isinstance(improvement_points, list):
                improvement_points = []

            improvement_points = [
                str(point).strip()
                for point in improvement_points
                if str(point or '').strip()
            ][:5]

            is_correct_raw = row.get('is_correct')
            if isinstance(is_correct_raw, bool):
                is_correct = is_correct_raw
            else:
                is_correct = semantic_score >= 0.55

            normalized[index] = {
                'is_correct': is_correct,
                'semantic_score': semantic_score,
                'feedback': feedback,
                'improvement_points': improvement_points,
            }

        return normalized
    
    def post(self, request):
        user = request.user
        quiz_data = request.data.get('quiz_data', {})
        answers = request.data.get('answers', {})
        
        if not quiz_data or not answers:
            return Response({'error': 'Quiz data and answers are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            questions = quiz_data.get('questions', [])
            total_questions = len(questions)

            # Use Hybrid AI Service for semantic grading + report generation.
            from .ai_service import get_ai_service
            ai_service = get_ai_service()

            subject = quiz_data.get('subject', 'General')
            class_level = quiz_data.get('classLevel', user.class_level or 9)

            provisional_results = []
            open_ended_items = []

            for idx, question in enumerate(questions):
                user_answer = answers.get(str(idx), '')
                correct_answer = question.get('correctAnswer', '')
                question_type = str(question.get('type', 'mcq') or 'mcq').lower()
                question_options = question.get('options', {})

                rule_based_correct = evaluate_quiz_answer(
                    question_type=question_type,
                    selected_answer=user_answer,
                    correct_answer=correct_answer,
                    raw_options=question_options,
                )

                user_answer_display = format_answer_for_display(
                    question_type=question_type,
                    answer=user_answer,
                    raw_options=question_options,
                )
                correct_answer_display = format_answer_for_display(
                    question_type=question_type,
                    answer=correct_answer,
                    raw_options=question_options,
                )

                has_answer = bool(str(user_answer or '').strip())

                provisional_results.append({
                    'index': idx,
                    'question_id': question.get('id'),
                    'question_text': question.get('text', ''),
                    'question_type': question_type,
                    'has_answer': has_answer,
                    'rule_based_correct': rule_based_correct,
                    'user_answer': user_answer,
                    'user_answer_display': user_answer_display,
                    'correct_answer': correct_answer,
                    'correct_answer_display': correct_answer_display,
                    'options': question_options,
                    'semantic_score': None,
                    'semantic_feedback': '',
                    'improvement_points': []
                })

                if has_answer and question_type in ('short', 'long'):
                    open_ended_items.append({
                        'index': idx,
                        'question_type': question_type,
                        'question_text': question.get('text', ''),
                        'user_answer': str(user_answer or ''),
                        'correct_answer': str(correct_answer or ''),
                    })

            semantic_results = self._grade_open_ended_answers_with_ai(
                ai_service=ai_service,
                subject=subject,
                class_level=class_level,
                open_ended_items=open_ended_items,
            )

            correct_count = 0
            wrong_count = 0
            unanswered_count = 0
            detailed_results = []
            wrong_answers = []

            for item in provisional_results:
                semantic_result = semantic_results.get(item['index'])
                if semantic_result:
                    evaluated_correct = semantic_result['is_correct']
                    grading_source = 'ai_semantic'
                    semantic_score = semantic_result['semantic_score']
                    semantic_feedback = semantic_result['feedback']
                    improvement_points = semantic_result['improvement_points']
                else:
                    evaluated_correct = item['rule_based_correct']
                    grading_source = 'rule_based'
                    semantic_score = None
                    semantic_feedback = ''
                    improvement_points = []

                if not item['has_answer']:
                    status_text = 'unanswered'
                    unanswered_count += 1
                    grading_source = 'unanswered'
                elif evaluated_correct:
                    status_text = 'correct'
                    correct_count += 1
                else:
                    status_text = 'wrong'
                    wrong_count += 1

                    option_map = normalize_options(item['options'])
                    option_list = [f"{key}) {value}" for key, value in option_map.items()]
                    wrong_answers.append({
                        'question': item['question_text'],
                        'userAnswer': item['user_answer_display'],
                        'correctAnswer': item['correct_answer_display'],
                        'options': option_list,
                        'ai_feedback': semantic_feedback,
                        'improvement_points': improvement_points,
                    })

                detailed_results.append({
                    'question_id': item['question_id'],
                    'question_text': item['question_text'],
                    'question_type': item['question_type'],
                    'user_answer': item['user_answer'],
                    'user_answer_display': item['user_answer_display'],
                    'correct_answer': item['correct_answer'],
                    'correct_answer_display': item['correct_answer_display'],
                    'status': status_text,
                    'is_correct': bool(evaluated_correct) if item['has_answer'] else False,
                    'grading_source': grading_source,
                    'semantic_score': semantic_score,
                    'semantic_feedback': semantic_feedback,
                    'improvement_points': improvement_points,
                })
            
            score_percentage = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
            
            # Create comprehensive analysis prompt
            analysis_prompt = f"""আপনি একজন বিশেষজ্ঞ শিক্ষা বিশ্লেষক। একজন Class {class_level} এর শিক্ষার্থী {subject} বিষয়ে একটি কুইজ দিয়েছে।

**কুইজ ফলাফল:**
- মোট প্রশ্ন: {total_questions}
- সঠিক উত্তর: {correct_count}
- ভুল উত্তর: {wrong_count}
- উত্তর দেয়নি: {unanswered_count}
- স্কোর: {score_percentage}%

**ভুল উত্তরগুলো:**
{chr(10).join([f"প্রশ্ন: {w['question']}\nশিক্ষার্থীর উত্তর: {w['userAnswer']}\nসঠিক উত্তর: {w['correctAnswer']}" for w in wrong_answers[:5]])}

অনুগ্রহ করে নিম্নলিখিত বিষয়ে একটি বিস্তারিত বিশ্লেষণ প্রদান করুন (বাংলায়):

## 📊 সামগ্রিক পারফরম্যান্স বিশ্লেষণ
- শিক্ষার্থীর শক্তিশালী দিক
- উন্নতির প্রয়োজন এমন ক্ষেত্র
- স্কোরের মূল্যায়ন

## 🎯 ভুল ধারণা চিহ্নিতকরণ
- কোন টপিকগুলোতে ভুল বেশি হয়েছে
- সাধারণ ভুলের প্যাটার্ন
- মূল সমস্যা কোথায়

## 💡 উন্নতির জন্য পরামর্শ
- কোন টপিকগুলো আরও পড়তে হবে
- কীভাবে অনুশীলন করবে
- পড়ার কৌশল

## 📚 পরবর্তী পদক্ষেপ
- অগ্রাধিকার ভিত্তিতে পড়ার তালিকা
- অনুশীলনের জন্য পরামর্শ
- আত্মবিশ্বাস বৃদ্ধির উপায়

উৎসাহব্যঞ্জক এবং গঠনমূলক ভাষায় লিখুন। শিক্ষার্থীকে অনুপ্রাণিত করুন।"""
            
            success, ai_analysis, error, source = ai_service.generate(analysis_prompt, timeout=90)
            
            if not success:
                ai_analysis = f"দুঃখিত, বিশ্লেষণ তৈরি করতে সমস্যা হয়েছে।\n\nআপনার স্কোর: {score_percentage}%\nসঠিক: {correct_count}/{total_questions}\n\nঅনুগ্রহ করে আবার চেষ্টা করুন।"
            else:
                print(f"[Quiz Analysis] Response from: {source}")
            
            # Return comprehensive results
            return Response({
                'summary': {
                    'total_questions': total_questions,
                    'correct': correct_count,
                    'wrong': wrong_count,
                    'unanswered': unanswered_count,
                    'score_percentage': score_percentage,
                    'ai_graded_count': len(semantic_results),
                },
                'detailed_results': detailed_results,
                'ai_analysis': ai_analysis,
                'wrong_answers': wrong_answers
            })
            
        except Exception as e:
            return Response({'error': f'Error analyzing quiz: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GeneratePersonalizedLearningView(APIView):
    """Generate personalized learning plan based on wrong answers"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        wrong_answers = request.data.get('wrong_answers', [])
        subject = request.data.get('subject', 'General')
        class_level = request.data.get('class_level', user.class_level or 9)
        
        print(f"[Learning Plan] User: {user.username}, Subject: {subject}, Class: {class_level}")
        print(f"[Learning Plan] Wrong answers count: {len(wrong_answers)}")
        
        if not wrong_answers:
            return Response({'message': 'Great job! You got all questions correct. No learning plan needed.'})
        
        try:
            # Use Hybrid AI Service for learning plan generation
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            # Create detailed learning prompt
            mistake_blocks = []
            for i, wrong in enumerate(wrong_answers):
                options_value = wrong.get('options', [])
                if isinstance(options_value, dict):
                    options_list = [f"{key}) {value}" for key, value in options_value.items()]
                elif isinstance(options_value, list):
                    options_list = [str(item) for item in options_value]
                elif options_value:
                    options_list = [str(options_value)]
                else:
                    options_list = []

                mistake_blocks.append(
                    f"**প্রশ্ন {i+1}:** {wrong['question']}\n"
                    f"**শিক্ষার্থীর উত্তর:** {wrong['userAnswer']}\n"
                    f"**সঠিক উত্তর:** {wrong['correctAnswer']}\n"
                    f"**অপশনগুলো:** {', '.join(options_list)}"
                )

            mistakes_text = "\n\n".join(mistake_blocks)
            
            learning_prompt = f"""আপনি একজন অভিজ্ঞ শিক্ষক যিনি Class {class_level} এর শিক্ষার্থীদের {subject} বিষয়ে পড়ান।

একজন শিক্ষার্থী নিম্নলিখিত প্রশ্নগুলোতে ভুল করেছে:

{mistakes_text}

অনুগ্রহ করে একটি **ব্যক্তিগত শিক্ষা পরিকল্পনা** তৈরি করুন যাতে থাকবে:

## 🎓 প্রতিটি ভুলের বিস্তারিত ব্যাখ্যা

প্রতিটি ভুল প্রশ্নের জন্য:
1. **কেন ভুল হয়েছে:** শিক্ষার্থী কোন ধারণায় ভুল করেছে
2. **সঠিক ধারণা:** সহজ ভাষায় সঠিক ব্যাখ্যা
3. **মনে রাখার কৌশল:** সহজে মনে রাখার টিপস
4. **উদাহরণ:** বাস্তব জীবনের উদাহরণ বা সহজ উদাহরণ

## 📖 পড়ার পরিকল্পনা

- কোন অধ্যায়/টপিক আবার পড়তে হবে
- কোন বইয়ের কোন পৃষ্ঠা দেখতে হবে (NCTB বই অনুযায়ী)
- অনলাইন রিসোর্স (যদি থাকে)

## ✍️ অনুশীলনের পরামর্শ

- কী ধরনের প্রশ্ন অনুশীলন করতে হবে
- কতগুলো প্রশ্ন করতে হবে
- কীভাবে অনুশীলন করবে

## 🎯 চেক-পয়েন্ট

শিক্ষার্থী বুঝেছে কিনা তা যাচাই করার জন্য ৩-৫টি সহজ প্রশ্ন দিন।

## 💪 উৎসাহব্যঞ্জক বার্তা

শিক্ষার্থীকে অনুপ্রাণিত করুন এবং আত্মবিশ্বাস বাড়ান।

---

**গুরুত্বপূর্ণ:** সহজ, স্পষ্ট এবং উৎসাহব্যঞ্জক ভাষায় লিখুন। শিক্ষার্থী যেন সহজেই বুঝতে পারে এবং অনুপ্রাণিত হয়।"""
            
            print(f"[Learning Plan] Calling AI Service...")
            success, learning_plan, error, source = ai_service.generate(learning_prompt, timeout=120)
            
            if not success:
                print(f"[Learning Plan] ERROR: {error}")
                return Response({
                    'error': f'Failed to generate learning plan: {error}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            print(f"[Learning Plan] Successfully generated learning plan from {source} (length: {len(learning_plan)})")
            
            # Clean the response - remove excessive markdown formatting
            # Keep basic structure but remove symbols that might look messy
            cleaned_plan = learning_plan
            # Remove excessive # symbols but keep structure
            cleaned_plan = cleaned_plan.replace('###', '').replace('##', '').replace('#', '')
            # Keep ** for emphasis but make it cleaner
            # Keep the text readable in plain format
            
            return Response({
                'learning_plan': cleaned_plan,
                'topics_to_review': [w['question'][:50] + '...' for w in wrong_answers[:5]],
                'total_mistakes': len(wrong_answers)
            })
            
        except Exception as e:
            error_message = str(e)
            print(f"[Learning Plan] ERROR: {error_message}")
            
            # Check for specific Gemini API errors
            if 'API key' in error_message or 'api_key' in error_message:
                return Response({'error': 'Gemini API key configuration error. Please contact support.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            elif 'quota' in error_message.lower():
                return Response({'error': 'API quota exceeded. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            elif 'permission' in error_message.lower():
                return Response({'error': 'API permission denied. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({'error': f'Error generating learning plan: {error_message}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# Web Scraping & Website Analysis Features
# ==========================================

class AnalyzeWebsiteView(APIView):
    """
    Analyze a website or URL for educational content
    Endpoint: POST /api/ai/analyze-website/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        url = request.data.get('url', '').strip()
        query = request.data.get('query', '').strip()
        
        if not url:
            return Response(
                {'error': 'URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .web_scraping_service import WebScrapingService
            
            # Analyze the website
            success, analysis, error = WebScrapingService.analyze_url_for_education(url, query)
            
            if not success:
                return Response(
                    {'error': error},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Now use AI to generate insights from the extracted content
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            user_class = f"Class {request.user.class_level}" if request.user.class_level else "General"
            
            ai_prompt = f"""You are an educational AI assistant helping a {user_class} student understand web content.

Here is content extracted from {url}:

{analysis}

Please provide:
1. **Summary**: A concise summary of the main concepts (2-3 sentences)
2. **Key Concepts**: Most important learning points (bullet list)
3. **Educational Value**: How this content helps their studies
4. **Practice Task**: A simple exercise based on this content
5. **Related Topics**: Other related topics they should explore

{'Query Focus: ' + query if query else 'Provide general educational insights.'}

Write in a clear, student-friendly manner. Use Bangla for explanations if helpful."""
            
            success, insights, error, source = ai_service.generate(ai_prompt, timeout=60)
            
            if not success:
                # Return analysis without AI insights if AI generation fails
                return Response({
                    'analysis': analysis,
                    'insights': None,
                    'warning': f'Could not generate AI insights: {error}'
                })
            
            return Response({
                'url': url,
                'analysis': analysis,
                'insights': insights,
                'ai_source': source
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error analyzing website: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SearchEducationalResourcesView(APIView):
    """
    Search for educational resources online
    Endpoint: GET /api/ai/search-resources/?query=...
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('query', '').strip()
        search_type = request.query_params.get('type', 'wikipedia')  # wikipedia, web
        
        if not query or len(query) < 3:
            return Response(
                {'error': 'Search query must be at least 3 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .web_scraping_service import SearchService
            
            if search_type == 'wikipedia':
                success, results, error = SearchService.search_wikipedia(query)
            else:
                # Default to Wikipedia
                success, results, error = SearchService.search_wikipedia(query)
            
            if not success:
                return Response(
                    {'error': error},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add AI-generated context for each result
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            for result in results[:3]:  # Get context for top 3 results
                try:
                    prompt = f"""For a Class 6-12 Bangladeshi student learning about "{query}":
                    
Summary to expand: {result.get('snippet', '')}

Provide 2-3 educational context points that would help them understand why this is relevant to their studies."""
                    
                    success, context, _, _ = ai_service.generate(prompt, timeout=30)
                    if success:
                        result['context'] = context
                except:
                    pass  # Skip if AI context generation fails
            
            return Response({
                'query': query,
                'results': results,
                'total': len(results)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error searching resources: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIWebIntegrationChatView(APIView):
    """
    Chat with AI, enhanced with web search capability
    Allows the AI to search the web if needed for current information
    Endpoint: POST /api/ai/web-integrated-chat/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        session_id = request.data.get('session_id')
        message = request.data.get('message')
        include_web_search = request.data.get('search_web', False)
        
        try:
            session = AIChatSession.objects.get(session_id=session_id, user=user)
            
            # Save user message
            user_message = AIChatMessage.objects.create(
                session=session,
                message=message,
                is_user_message=True,
                message_type='web_integrated_chat'
            )
            
            from .ai_service import get_ai_service
            ai_service = get_ai_service()
            
            # If web search is requested, search for current information
            search_results = None
            if include_web_search:
                try:
                    from .web_scraping_service import SearchService
                    _, results, _ = SearchService.search_wikipedia(message)
                    search_results = results[:3]  # Get top 3 results
                except:
                    pass  # Gracefully handle search failures
            
            # Build enhanced prompt with search results if available
            class_info = f"Class {user.class_level}" if user.class_level else "Classes 6-12"
            
            if search_results:
                search_context = "\n\nRelated Resources Found:\n"
                for i, result in enumerate(search_results, 1):
                    search_context += f"\n{i}. {result.get('title', 'Resource')} \n   {result.get('snippet', '')[0:200]}..."
                
                prompt = f"""You are an AI education assistant for {class_info} students in Bangladesh.

Here are search results related to their question:
{search_context}

Student's Question: {message}

Use the search results to provide accurate, current information. 
However, rely on your core knowledge too. Provide helpful, educational response suitable for their class level.

Respond in Bangla when possible for clarity."""
            else:
                prompt = f"""You are an AI education assistant for {class_info} students in Bangladesh.

Student's Question: {message}

Provide a helpful, educational response.
- Break down complex topics into simple parts
- Use examples when helpful
- Respond in Bangla for clarity when needed
- Keep it suitable for their class level"""
            
            success, ai_response, error, source = ai_service.generate(prompt, timeout=60)
            
            if not success:
                ai_response = f"দুঃখিত, উত্তর তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।\n\nError: {error}"
            
            # Save AI message
            ai_message = AIChatMessage.objects.create(
                session=session,
                message=ai_response,
                is_user_message=False,
                message_type='web_integrated_chat'
            )
            
            return Response({
                'user_message': AIChatMessageSerializer(user_message).data,
                'ai_message': ai_response,
                'search_sources': len(search_results) if search_results else 0,
                'ai_source': source
            })
            
        except AIChatSession.DoesNotExist:
            return Response(
                {'error': 'Chat session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error in web-integrated chat: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
