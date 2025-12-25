"""
Test script to verify Gemini 1.5 Flash API is working
This model has higher quota: 1,500 requests/day (vs 20/day for 2.5-flash)
"""
import os
import warnings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress deprecation warnings
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai

def test_gemini_15_flash():
    """Test if Gemini 1.5 Flash is working"""
    
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
        
        # Create model - using 1.5-flash instead of 2.5-flash
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✓ Model created: gemini-1.5-flash")
        
        # Test with a simple prompt
        print("\nTesting API with a simple prompt...")
        response = model.generate_content("Say 'Hello' in Bangla")
        
        if response and response.text:
            print(f"✓ API Response received: {response.text[:100]}")
            print("\n✅ SUCCESS: Gemini 1.5 Flash is working!")
            print("\n📊 Quota Info:")
            print("   - Model: gemini-1.5-flash")
            print("   - Free tier limit: 1,500 requests/day")
            print("   - Rate limit: 15 requests/minute")
            return True
        else:
            print("❌ ERROR: No response from API")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        
        # Provide specific error messages
        error_str = str(e).lower()
        if 'quota' in error_str:
            print("\n💡 Both models have quota issues!")
            print("   Solutions:")
            print("   1. Create new API key: https://aistudio.google.com/apikey")
            print("   2. Wait for quota reset (24 hours)")
            print("   3. Upgrade to paid plan")
        elif 'api key' in error_str:
            print("\n💡 API key issue:")
            print("   1. Get new key: https://aistudio.google.com/apikey")
            print("   2. Update GEMINI_API_KEY in backend/.env")
        
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("Testing Gemini 1.5 Flash API")
    print("=" * 70)
    print()
    
    success = test_gemini_15_flash()
    
    print()
    print("=" * 70)
    if success:
        print("✅ gemini-1.5-flash is working!")
        print("\nTo use this model in your app:")
        print("  python quick_fix_quota.py")
        print("\nThen restart your server:")
        print("  python manage.py runserver")
    else:
        print("❌ gemini-1.5-flash also has quota issues")
        print("\nBest solution: Create new API key")
        print("  https://aistudio.google.com/apikey")
    print("=" * 70)
