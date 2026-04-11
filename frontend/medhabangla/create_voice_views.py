import os

# Create Voice Conversation Views
views_code = '''
import json
import uuid
from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
import google.generativeai as genai
from django.conf import settings
from quizzes.models import Quiz

# Import our voice models
from .voice_conversation_models import (
    VoiceConversationSession, VoiceConversationMessage, 
    VoiceQuizSession, VoiceQuizQuestion, VoiceQuizAnswer, ConversationSummary
)
from .serializers import (
    VoiceConversationSessionSerializer, VoiceConversationMessageSerializer,
    VoiceQuizSessionSerializer, VoiceQuizQuestionSerializer,
    VoiceQuizAnswerSerializer, ConversationSummarySerializer
)
from .ai_service import get_ai_service
from accounts.models import User


class StartVoiceConversationView(APIView):
    """Start a new voice conversation session"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        mode = request.data.get(\"mode\", \"tutor\")  # tutor, exam, quiz, general
        subject = request.data.get(\"subject\", \"\")
        topic = request.data.get(\"topic\", \"\")
        
        session_id = str(uuid.uuid4())
        
        # Retrieve context from past sessions if available
        previous_context = None
        if subject:
            past_session = VoiceConversationSession.objects.filter(
                user=request.user,
                subject=subject,
                is_active=False
            ).order_by(\"-ended_at\").first()
            
            if past_session and past_session.conversation_summary:
                previous_context = past_session.conversation_summary
        
        session = VoiceConversationSession.objects.create(
            user=request.user,
            session_id=session_id,
            mode=mode,
            subject=subject,
            topic=topic,
            previous_session_context=previous_context
        )
        
        serializer = VoiceConversationSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VoiceMessageView(APIView):
    \"\"\"Send a voice/text message and get AI response\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get(\"session_id\")
        message_text = request.data.get(\"message_text\")
        transcript = request.data.get(\"transcript\", \"\")  # For voice transcription
        audio_url = request.data.get(\"audio_url\", \"\")
        
        try:
            session = VoiceConversationSession.objects.get(
                session_id=session_id,
                user=request.user
            )
        except VoiceConversationSession.DoesNotExist:
            return Response({\"error\": \"Session not found\"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Store user message
        user_msg = VoiceConversationMessage.objects.create(
            session=session,
            message_text=message_text or transcript,
            message_type=\"question\" if session.mode == \"tutor\" else \"quiz_question\",
            is_user_message=True,
            audio_url=audio_url,
            transcript=transcript
        )
        
        # Build context for AI
        context = f\"\"\"You are an expert AI teacher helping a student in Class {request.user.class_level or 9}.
        
Mode: {session.get_mode_display()}
Subject: {session.subject or \"General\"}
Topic: {session.topic or \"Various\"}

Previous Context: {session.previous_session_context or \"No previous context\"}

\"\"\"
        
        # Generate AI response based on mode
        ai_service = get_ai_service()
        
        if session.mode == \"exam\":
            prompt = context + f\"\"\"The student asking: {message_text or transcript}
            
As their exam proctor and teacher, provide a detailed, educational response that:
1. Clarifies their doubt if needed
2. Provides step-by-step explanation
3. Evaluates their understanding
4. Motivates them positively

Keep the tone supportive but academically rigorous.\"\"\"
        
        elif session.mode == \"quiz\":
            prompt = context + f\"\"\"The student's answer to the question: {message_text or transcript}
            
Please evaluate their answer for correctness and provide:
1. Whether the answer is correct (YES/NO)
2. Score out of 10
3. Detailed explanation of the concept
4. If incorrect, explain the correct answer
5. Provide a tip for similar problems

Format your response as JSON:
{{
  \"is_correct\": true/false,
  \"score\": number,
  \"explanation\": \"string\",
  \"feedback\": \"string\",
  \"tip\": \"string\"
}}\"\"\"
        
        else:
            prompt = context + f\"\"\"Student's question/doubt: {message_text or transcript}
            
As a caring and knowledgeable tutor, provide:
1. A clear, simple explanation
2. Real-world examples if possible
3. Common mistakes to avoid
4. Practice suggestion
5. Related concept to explore next

Make it engaging and easy to understand.\"\"\"
        
        success, ai_response, error, source = ai_service.generate(
            prompt=prompt,
            feature_type=\"voice_ai_provider\"
        )
        
        if not success:
            return Response({\"error\": error}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Parse response if quiz mode
        if session.mode == \"quiz\":
            try:
                json_response = json.loads(ai_response)
                is_correct = json_response.get(\"is_correct\", False)
                if is_correct:
                    session.correct_answers += 1
                session.total_questions_asked += 1
            except:
                is_correct = False
        
        # Store AI response
        ai_msg = VoiceConversationMessage.objects.create(
            session=session,
            message_text=ai_response,
            message_type=\"answer\",
            is_user_message=False,
            ai_response=ai_response,
            confidence_score=0.85
        )
        
        serializer = VoiceConversationMessageSerializer(ai_msg)
        return Response({
            \"message\": serializer.data,
            \"session_id\": session_id
        })


class EndVoiceConversationView(APIView):
    \"\"\"End conversation session and generate summary\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get(\"session_id\")
        
        try:
            session = VoiceConversationSession.objects.get(
                session_id=session_id,
                user=request.user
            )
        except VoiceConversationSession.DoesNotExist:
            return Response({\"error\": \"Session not found\"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        session.is_active = False
        session.ended_at = datetime.now()
        
        # Generate summary using AI
        all_messages = session.messages.all()
        messages_text = \"\\n\".join([
            f\"{'User' if m.is_user_message else 'AI'}: {m.message_text[:200]}...\"
            for m in all_messages[:20]
        ])
        
        ai_service = get_ai_service()
        summary_prompt = f\"\"\"Based on this educational conversation, create a structured summary:

{messages_text}

Generate a JSON response with:
{{
  \"summary\": \"Brief overall summary\",
  \"key_concepts\": [\"concept1\", \"concept2\"],
  \"doubts_cleared\": [\"doubt1\", \"doubt2\"],
  \"weak_areas\": [\"area1\"],
  \"strong_areas\": [\"area1\"],
  \"next_topics\": [\"topic1\", \"topic2\"],
  \"recommendations\": \"Study recommendations\"
}}\"\"\"
        
        success, summary_response, error, _ = ai_service.generate(summary_prompt)
        
        if success:
            try:
                summary_data = json.loads(summary_response)
                session.conversation_summary = summary_data.get(\"summary\", \"\")
                session.key_points = summary_data.get(\"key_concepts\", [])
            except:
                session.conversation_summary = summary_response
        
        session.save()
        
        # Create detailed summary record
        if success:
            ConversationSummary.objects.create(
                user=request.user,
                voice_session=session,
                summary_text=summary_data.get(\"summary\", \"\"),
                key_concepts=summary_data.get(\"key_concepts\", []),
                doubts_cleared=summary_data.get(\"doubts_cleared\", []),
                weak_concepts=summary_data.get(\"weak_areas\", []),
                strong_concepts=summary_data.get(\"strong_areas\", []),
                next_topics_to_study=summary_data.get(\"next_topics\", []),
                study_recommendations=summary_data.get(\"recommendations\", \"\")
            )
        
        serializer = VoiceConversationSessionSerializer(session)
        return Response(serializer.data)


class VoiceQuizStartView(APIView):
    \"\"\"Start a voice quiz/exam session\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        quiz_type = request.data.get(\"quiz_type\", \"practice\")
        subject = request.data.get(\"subject\", \"\")
        topic = request.data.get(\"topic\", \"\")
        difficulty = request.data.get(\"difficulty\", \"medium\")
        num_questions = request.data.get(\"num_questions\", 5)
        
        # First create a conversation session
        conversation_session = VoiceConversationSession.objects.create(
            user=request.user,
            session_id=str(uuid.uuid4()),
            mode=\"exam\" if quiz_type == \"exam\" else \"quiz\",
            subject=subject,
            topic=topic
        )
        
        # Create quiz session
        quiz_session = VoiceQuizSession.objects.create(
            user=request.user,
            conversation_session=conversation_session,
            quiz_type=quiz_type,
            subject=subject,
            topic=topic,
            class_level=request.user.class_level or 9,
            difficulty=difficulty,
            total_questions=num_questions
        )
        
        # Generate questions using AI
        ai_service = get_ai_service()
        questions_prompt = f\"\"\"Generate {num_questions} multiple choice questions for Class {request.user.class_level or 9} students.
        
Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

For each question, provide:
- Question text
- Four options (A, B, C, D)
- Correct option
- Brief explanation

Return as JSON array with format:
[
  {{
    \"question\": \"Question text?\",
    \"optionA\": \"Option A\",
    \"optionB\": \"Option B\",
    \"optionC\": \"Option C\",
    \"optionD\": \"Option D\",
    \"correctOption\": \"B\",
    \"explanation\": \"Why this is correct\"
  }}
]\"\"\"
        
        success, response, error, _ = ai_service.generate(questions_prompt)
        
        questions_data = []
        if success:
            try:
                questions_data = json.loads(response)
            except:
                # Try to extract JSON from response
                import re
                match = re.search(r'\\[.*\\]', response, re.DOTALL)
                if match:
                    questions_data = json.loads(match.group(0))
        
        # Store questions
        for idx, q in enumerate(questions_data, 1):
            VoiceQuizQuestion.objects.create(
                quiz_session=quiz_session,
                question_number=idx,
                question_text=q.get(\"question\", \"\"),
                question_type=\"mcq\",
                option_a=q.get(\"optionA\", \"\"),
                option_b=q.get(\"optionB\", \"\"),
                option_c=q.get(\"optionC\", \"\"),
                option_d=q.get(\"optionD\", \"\"),
                correct_option=q.get(\"correctOption\", \"\"),
                explanation=q.get(\"explanation\", \"\"),
            )
        
        serializer = VoiceQuizSessionSerializer(quiz_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VoiceQuizAnswerView(APIView):
    \"\"\"Submit answer for a quiz question\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        quiz_session_id = request.data.get(\"quiz_session_id\")
        question_id = request.data.get(\"question_id\")
        answer_text = request.data.get(\"answer_text\")
        transcript = request.data.get(\"transcript\", \"\")
        audio_url = request.data.get(\"audio_url\", \"\")
        
        try:
            quiz_session = VoiceQuizSession.objects.get(id=quiz_session_id, user=request.user)
            question = VoiceQuizQuestion.objects.get(id=question_id, quiz_session=quiz_session)
        except (VoiceQuizSession.DoesNotExist, VoiceQuizQuestion.DoesNotExist):
            return Response({\"error\": \"Quiz or question not found\"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Evaluate answer
        ai_service = get_ai_service()
        eval_prompt = f\"\"\"Evaluate this student's answer:
        
Question: {question.question_text}
Correct Answer: {question.correct_answer or question.correct_option}
Student's Answer: {answer_text or transcript}

Provide evaluation in JSON:
{{
  \"is_correct\": true/false,
  \"score_points\": number (0-10),
  \"explanation\": \"Explanation\",
  \"confidence\": number (0-1)
}}\"\"\"
        
        success, eval_response, error, _ = ai_service.generate(eval_prompt)
        
        is_correct = False
        score = 0.0
        evaluation = error if not success else eval_response
        
        if success:
            try:
                eval_data = json.loads(eval_response)
                is_correct = eval_data.get(\"is_correct\", False)
                score = eval_data.get(\"score_points\", 0.0)
            except:
                pass
        
        # Store answer
        answer = VoiceQuizAnswer.objects.create(
            quiz_question=question,
            user=request.user,
            answer_text=answer_text or transcript,
            answer_type=\"spoken\" if transcript else \"typed\",
            audio_url=audio_url,
            transcript=transcript,
            is_correct=is_correct,
            score_points=score,
            ai_evaluation=evaluation,
            time_taken_seconds=request.data.get(\"time_taken_seconds\", 60)
        )
        
        # Update quiz session
        quiz_session.questions_answered += 1
        if is_correct:
            quiz_session.correct_answers += 1
        quiz_session.score_percentage = (quiz_session.correct_answers / quiz_session.total_questions) * 100 if quiz_session.total_questions > 0 else 0
        quiz_session.save()
        
        serializer = VoiceQuizAnswerSerializer(answer)
        return Response(serializer.data)


class VoiceSessionHistoryView(APIView):
    \"\"\"Get conversation history and past session summaries\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        subject = request.query_params.get(\"subject\", \"\")
        
        sessions = VoiceConversationSession.objects.filter(user=request.user)
        if subject:
            sessions = sessions.filter(subject=subject)
        
        sessions = sessions.order_by(\"-created_at\")[:10]
        
        data = []
        for session in sessions:
            serializer = VoiceConversationSessionSerializer(session)
            data.append(serializer.data)
        
        return Response(data)


class VoiceSessionDetailsView(APIView):
    \"\"\"Get detailed session with all messages and summary\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, session_id):
        try:
            session = VoiceConversationSession.objects.get(
                session_id=session_id,
                user=request.user
            )
        except VoiceConversationSession.DoesNotExist:
            return Response({\"error\": \"Session not found\"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        messages = session.messages.all()
        
        data = {
            \"session\": VoiceConversationSessionSerializer(session).data,
            \"messages\": VoiceConversationMessageSerializer(messages, many=True).data,
        }
        
        if hasattr(session, \"summary\"):
            data[\"summary\"] = ConversationSummarySerializer(session.summary).data
        
        return Response(data)


class VoiceQuizResultsView(APIView):
    \"\"\"Get quiz results and performance analysis\"\"\"
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, quiz_session_id):
        try:
            quiz_session = VoiceQuizSession.objects.get(id=quiz_session_id, user=request.user)
        except VoiceQuizSession.DoesNotExist:
            return Response({\"error\": \"Quiz not found\"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        answers = quiz_session.questions.all().prefetch_related(\"answers\")
        
        weak_topics = []
        strong_topics = []
        
        for q in quiz_session.questions.all():
            answer = q.answers.first()
            if answer:
                if not answer.is_correct:
                    weak_topics.append(q.question_text[:50])
                else:
                    strong_topics.append(q.question_text[:50])
        
        quiz_session.weak_areas = weak_topics
        quiz_session.strong_areas = strong_topics
        quiz_session.save()
        
        serializer = VoiceQuizSessionSerializer(quiz_session)
        return Response(serializer.data)
'''

with open("../../backend/ai/voice_conversation_views.py", "w", encoding="utf-8") as f:
    f.write(views_code)

print("Created voice_conversation_views.py")
