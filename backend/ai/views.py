import uuid
import warnings
# Suppress the deprecation warning for google.generativeai
warnings.filterwarnings('ignore', category=FutureWarning, module='google.generativeai')
import google.generativeai as genai
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation
from .serializers import AIChatSessionSerializer, AIChatMessageSerializer, OfflineNoteSerializer, RemedialExplanationSerializer
from .ai_helper import ai_helper
from accounts.models import User, StudySession
from quizzes.models import Quiz, Analytics, QuizAttempt
from quizzes.serializers import QuizSerializer


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


class AIChatMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        session_id = request.data.get('session_id')
        message = request.data.get('message')
        message_type = request.data.get('message_type', 'general')
        
        try:
            session = AIChatSession.objects.get(session_id=session_id, user=user)
            
            # Save user message
            user_message = AIChatMessage.objects.create(
                session=session,
                message=message,
                is_user_message=True,
                message_type=message_type
            )
            
            # Get AI response using Google Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            # Customize prompt based on message type
            if message_type == 'remedial':
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
            else:
                class_info = f"Class {user.class_level}" if user.class_level else "Classes 6-12"
                prompt = f"""You are an educational AI assistant for Bangladeshi students studying in {class_info}. 
Be helpful, encouraging, and educational. Respond in Bangla when it helps with understanding.
Follow the NCTB (National Curriculum and Textbook Board) standards for Bangladesh.
Student: {message}"""
            
            response = model.generate_content(prompt)
            ai_response = response.text
            
            # Save AI message
            ai_message = AIChatMessage.objects.create(
                session=session,
                message=ai_response,
                is_user_message=False,
                message_type=message_type
            )
            
            return Response({
                'user_message': AIChatMessageSerializer(user_message).data,
                'ai_message': ai_response
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
            
            # Get AI explanation using Google Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-pro')
            
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
            
            response = model.generate_content(prompt)
            explanation = response.text
            
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
        
        try:
            # Get AI response using Google Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-pro')
            
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
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Try to parse the response as JSON
            import json
            import re
            
            try:
                # Remove markdown code blocks if present
                if response_text.startswith('```'):
                    response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                question_data = json.loads(response_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON from the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    question_data = json.loads(json_match.group())
                else:
                    raise ValueError("Could not extract valid JSON from AI response")
            
            # Create the quiz question in the database
            quiz_question = Quiz.objects.create(
                subject=subject,
                class_target=class_level,
                difficulty=difficulty,
                question_text=question_data['question_text'],
                question_type=question_type,
                options=question_data.get('options', {}),
                correct_answer=question_data['correct_answer'],
                explanation=question_data['explanation']
            )
            
            serializer = QuizSerializer(quiz_question)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Error generating question: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
