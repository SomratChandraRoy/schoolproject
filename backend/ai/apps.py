from django.apps import AppConfig


class AiConfig(AppConfig):
    name = 'ai'
    
    def ready(self):
        """Initialize the Gemini API key manager when Django starts"""
        from django.conf import settings
        from .api_key_manager import initialize_key_manager
        
        # Initialize the key manager with multiple API keys
        if hasattr(settings, 'GEMINI_API_KEYS') and settings.GEMINI_API_KEYS:
            initialize_key_manager(settings.GEMINI_API_KEYS)
            print(f"✅ Initialized Gemini API Key Manager with {len(settings.GEMINI_API_KEYS)} keys")
        else:
            print("⚠️  Warning: No Gemini API keys configured")
