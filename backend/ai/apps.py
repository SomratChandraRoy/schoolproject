from django.apps import AppConfig


class AiConfig(AppConfig):
    name = 'ai'
    
    def ready(self):
        """Initialize AI runtime helpers when Django starts"""
        from django.conf import settings
        
        # Initialize the Gemini key manager only when Gemini keys exist
        if hasattr(settings, 'GEMINI_API_KEYS') and settings.GEMINI_API_KEYS:
            from .api_key_manager import initialize_key_manager
            initialize_key_manager(settings.GEMINI_API_KEYS)
            print(f"✅ Initialized Gemini API Key Manager with {len(settings.GEMINI_API_KEYS)} keys")
        elif getattr(settings, 'GROQ_API_KEY', None):
            print("✅ Groq API key configured")
        else:
            print("⚠️  Warning: No AI API keys configured")
