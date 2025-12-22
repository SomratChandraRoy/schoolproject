"""
Test script to verify Gemini API key is working
Run this before starting the server to ensure API is configured correctly
"""
import os
import warnings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress deprecation warnings
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai

def test_gemini_api():
    """Test if Gemini API key is valid and working"""
    
    # Get API key from environment
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in .env file")
        return False
    
    print(f"✓ API Key found: {api_key[:20]}...")
    
    try:
        # Configure Gemini
        genai.configure(api_key=api_key)
        print("✓ Gemini configured successfully")
        
        # Create model
        model = genai.GenerativeModel('gemini-2.5-flash')
        print("✓ Model created successfully")
        
        # Test with a simple prompt
        print("\nTesting API with a simple prompt...")
        response = model.generate_content("Say 'Hello' in Bangla")
        
        if response and response.text:
            print(f"✓ API Response received: {response.text[:100]}")
            print("\n✅ SUCCESS: Gemini API is working correctly!")
            return True
        else:
            print("❌ ERROR: No response from API")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        
        # Provide specific error messages
        error_str = str(e).lower()
        if 'api key' in error_str or 'api_key' in error_str:
            print("\n💡 Solution: Your API key is invalid or expired.")
            print("   1. Go to https://makersuite.google.com/app/apikey")
            print("   2. Create a new API key")
            print("   3. Update GEMINI_API_KEY in backend/.env file")
        elif 'quota' in error_str:
            print("\n💡 Solution: API quota exceeded.")
            print("   1. Wait for quota to reset")
            print("   2. Or create a new API key")
        elif 'permission' in error_str:
            print("\n💡 Solution: API key doesn't have required permissions.")
            print("   1. Check API key settings in Google AI Studio")
            print("   2. Ensure Gemini API is enabled")
        
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Gemini API Configuration")
    print("=" * 60)
    print()
    
    success = test_gemini_api()
    
    print()
    print("=" * 60)
    if success:
        print("You can now start the Django server:")
        print("  python manage.py runserver")
    else:
        print("Please fix the API key issue before starting the server")
    print("=" * 60)
