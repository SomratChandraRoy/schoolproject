import os
import django
import warnings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

# Suppress warnings
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai
from django.conf import settings

def list_available_models():
    """List all available Gemini models"""
    
    print("=" * 60)
    print("Listing Available Gemini Models")
    print("=" * 60)
    
    try:
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        print("\nAvailable models:")
        print("-" * 60)
        
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"\n✅ {model.name}")
                print(f"   Display Name: {model.display_name}")
                print(f"   Description: {model.description[:100]}..." if len(model.description) > 100 else f"   Description: {model.description}")
                print(f"   Supported methods: {', '.join(model.supported_generation_methods)}")
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == '__main__':
    list_available_models()
