"""
Check available Gemini models
"""
import os
import warnings
from dotenv import load_dotenv

load_dotenv()
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai

api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)

print("Available Gemini Models:")
print("=" * 60)

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✓ {model.name}")
            print(f"  Display Name: {model.display_name}")
            print(f"  Description: {model.description[:100]}...")
            print()
except Exception as e:
    print(f"Error: {e}")
