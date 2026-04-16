"""
Admin Views for AI Provider Settings
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import ProviderSettings
from .serializers import AIProviderSettingsSerializer


class AIProviderSettingsView(APIView):
    """
    Get or Update AI Provider Settings (Admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get current AI provider settings"""
        # Allow all authenticated users to view settings
        settings = ProviderSettings.get_settings()
        serializer = AIProviderSettingsSerializer(settings)
        return Response(serializer.data)
    
    def post(self, request):
        """Update AI provider settings (Admin only)"""
        # Only admin can update
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admin users can update AI provider settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        settings = ProviderSettings.get_settings()
        serializer = AIProviderSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response({
                'message': 'AI provider settings updated successfully',
                'settings': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TestAIProviderView(APIView):
    """
    Test AI Provider Connection (Admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Test connection to selected AI provider"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admin users can test AI providers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        provider = request.data.get('provider', 'auto')
        settings_obj = ProviderSettings.get_settings()
        
        from .ai_service import get_ai_service
        ai_service = get_ai_service()
        
        # Test prompt
        test_prompt = "Say 'Hello' in one word"
        
        if provider == 'gemini':
            success, response, error = ai_service.generate_with_gemini(
                test_prompt,
                api_key_override=settings_obj.gemini_api_key
            )
            source = 'gemini'
        elif provider == 'groq':
            success, response, error = ai_service.generate_with_groq(
                test_prompt,
                api_key_override=settings_obj.groq_api_key
            )
            source = 'groq'
        elif provider == 'alibaba':
            success, response, error = ai_service.generate_with_alibaba(
                test_prompt,
                api_key_override=settings_obj.alibaba_api_key
            )
            source = 'alibaba'
        elif provider == 'elevenlabs':
            success, response, error = ai_service.generate_with_elevenlabs(
                test_prompt,
                api_key_override=settings_obj.elevenlabs_api_key
            )
            source = 'elevenlabs'
        elif provider == 'ollama':
            success, response, error = ai_service.generate_with_ollama(test_prompt, timeout=30)
            source = 'ollama'
        else:  # auto
            success, response, error, source = ai_service.generate(test_prompt, timeout=30)
        
        if success:
            return Response({
                'success': True,
                'message': f'{source.upper()} is working correctly',
                'response': response[:100],  # First 100 chars
                'source': source
            })
        else:
            return Response({
                'success': False,
                'message': f'Failed to connect to {provider}',
                'error': error
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
