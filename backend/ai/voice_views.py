import os
import io
import requests
import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .ai_service import get_ai_service
from .models import AIProviderSettings

class VoiceTutorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message')
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get AI Text Response
        prompt = f"""You are a friendly, encouraging AI Voice Tutor for students. 
Keep your responses short, conversational, and very easy to understand when spoken out loud.
Do not use markdown, emojis, or bullet points. Speak in plain text.
Student says: {user_message}"""

        ai_service = get_ai_service()
        success, text_response, error, _ = ai_service.generate(prompt=prompt, feature_type='voice_ai_provider')

        if not success:
            return Response({'error': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. Try ElevenLabs TTS
        audio_base64 = None
        try:
            settings = AIProviderSettings.objects.first()
            if settings and getattr(settings, 'elevenlabs_api_key', None):
                elevenlabs_key = settings.elevenlabs_api_key
                # Use standard voice (Rachel is a popular default voice, ID: 21m00Tcm4TlvDq8ikWAM)
                voice_id = '21m00Tcm4TlvDq8ikWAM'
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                
                headers = {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": elevenlabs_key
                }
                
                data = {
                    "text": text_response,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.5
                    }
                }
                
                response = requests.post(url, json=data, headers=headers)
                if response.status_code == 200:
                    audio_base64 = base64.b64encode(response.content).decode('utf-8')
                else:
                    print("ElevenLabs error:", response.text)
        except Exception as e:
            print("TTS Exception:", str(e))

        return Response({
            'text': text_response,
            'audio_base64': audio_base64
        })
