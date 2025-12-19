import uuid
import google.generativeai as genai
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation
from .serializers import AIChatSessionSerializer, AIChatMessageSerializer, OfflineNoteSerializer, RemedialExplanationSerializer
from accounts.models import User
from quizzes.models import Quiz, Analytics


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
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Customize prompt based on message type
            if message_type == 'remedial':
                prompt = f"You are an educational AI tutor for Bangladeshi students. The student is in Class {user.class_level}. Please explain the concept in simple terms in Bangla language. Here's their question: {message}"
            elif message_type == 'note_taking':
                prompt = f"You are an AI note-taking assistant. Summarize the following content in a structured format suitable for studying: {message}"
            else:
                prompt = f"You are an educational AI assistant for Bangladeshi students. Respond in Bangla when appropriate. User: {message}"
            
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
                'ai_message': AIChatMessageSerializer(ai_message).data
            })
            
        except AIChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)


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
        analytics_id = request.data.get('analytics_id')
        
        try:
            # Get analytics data to understand mistakes
            analytics = Analytics.objects.get(id=analytics_id, user=user)
            mistakes = analytics.mistakes
            
            # Prepare mistake analysis prompt for Gemini
            mistake_details = []
            for quiz_id, user_answer in mistakes.items():
                try:
                    quiz = Quiz.objects.get(id=quiz_id)
                    mistake_details.append(f"Question: {quiz.question_text}\nUser Answer: {user_answer}\nCorrect Answer: {quiz.correct_answer}")
                except Quiz.DoesNotExist:
                    continue
            
            if not mistake_details:
                return Response({'error': 'No mistakes found for analysis'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get AI explanation using Google Gemini
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
            You are an expert educational AI tutor for Bangladeshi students. Analyze the following mistakes made by a Class {user.class_level} student and provide remedial guidance in Bangla:
            
            Mistakes:
            {chr(10).join(mistake_details)}
            
            Please provide:
            1. Identification of the conceptual gaps
            2. Clear explanation of the correct concepts in Bangla
            3. Three "Check for Understanding" bullet points in Bangla
            """
            
            response = model.generate_content(prompt)
            explanation = response.text
            
            # Save the remedial explanation
            remedial = RemedialExplanation.objects.create(
                user=user,
                # We'll associate with the first quiz from mistakes for simplicity
                quiz=Quiz.objects.get(id=list(mistakes.keys())[0]),
                explanation=explanation
            )
            
            serializer = RemedialExplanationSerializer(remedial)
            return Response(serializer.data)
            
        except Analytics.DoesNotExist:
            return Response({'error': 'Analytics data not found'}, status=status.HTTP_404_NOT_FOUND)