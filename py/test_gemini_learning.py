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

def test_gemini_learning_api():
    """Test Gemini API for learning plan generation"""
    
    print("=" * 60)
    print("Testing Gemini API for Learning Plan Generation")
    print("=" * 60)
    
    # Check API key
    api_key = settings.GEMINI_API_KEY
    print(f"\n1. API Key configured: {'Yes' if api_key else 'No'}")
    if api_key:
        print(f"   API Key (first 10 chars): {api_key[:10]}...")
    
    try:
        # Configure Gemini
        print("\n2. Configuring Gemini API...")
        genai.configure(api_key=api_key)
        
        # Test with simple learning prompt
        print("\n3. Testing learning plan generation...")
        model = genai.GenerativeModel('gemini-2.5-flash')  # Use stable model
        
        test_prompt = """আপনি একজন অভিজ্ঞ শিক্ষক। একজন Class 9 এর শিক্ষার্থী নিম্নলিখিত প্রশ্নে ভুল করেছে:

**প্রশ্ন:** What is the capital of Bangladesh?
**শিক্ষার্থীর উত্তর:** Chittagong
**সঠিক উত্তর:** Dhaka

অনুগ্রহ করে একটি সংক্ষিপ্ত শিক্ষা পরিকল্পনা দিন (২-৩ লাইন)।"""
        
        response = model.generate_content(test_prompt)
        learning_plan = response.text
        
        print("\n4. ✅ SUCCESS! Learning plan generated:")
        print("-" * 60)
        print(learning_plan[:200] + "..." if len(learning_plan) > 200 else learning_plan)
        print("-" * 60)
        
        print(f"\n5. Response length: {len(learning_plan)} characters")
        print("\n✅ Gemini API is working correctly for learning plans!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print(f"\nError type: {type(e).__name__}")
        
        error_str = str(e).lower()
        if 'api key' in error_str or 'api_key' in error_str:
            print("\n⚠️  Issue: API key is invalid or expired")
            print("   Solution: Check your GEMINI_API_KEY in .env file")
        elif 'quota' in error_str:
            print("\n⚠️  Issue: API quota exceeded")
            print("   Solution: Wait or upgrade your Gemini API plan")
        elif 'permission' in error_str:
            print("\n⚠️  Issue: Permission denied")
            print("   Solution: Check API key permissions in Google AI Studio")
        elif 'model' in error_str:
            print("\n⚠️  Issue: Model not found or not accessible")
            print("   Solution: Try using 'gemini-pro' instead of 'gemini-2.0-flash-exp'")
        else:
            print(f"\n⚠️  Unknown error: {str(e)}")
        
        return False

if __name__ == '__main__':
    test_gemini_learning_api()
