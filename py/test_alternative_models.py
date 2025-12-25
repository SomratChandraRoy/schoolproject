"""
Test alternative Gemini models to find one with available quota
"""
import os
import warnings
from dotenv import load_dotenv

load_dotenv()
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai

def test_model(model_name):
    """Test a specific model"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say 'Hello' in one word")
        
        if response and response.text:
            return True, response.text[:50]
        return False, "No response"
    except Exception as e:
        error_msg = str(e)
        if 'quota' in error_msg.lower():
            return False, "Quota exceeded"
        elif '404' in error_msg:
            return False, "Model not found"
        else:
            return False, error_msg[:100]

if __name__ == "__main__":
    print("=" * 70)
    print("Testing Alternative Gemini Models")
    print("=" * 70)
    print()
    
    # Models to test (from fastest/cheapest to slowest/expensive)
    models_to_test = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
    ]
    
    working_models = []
    
    for model_name in models_to_test:
        print(f"Testing {model_name}...", end=" ")
        success, message = test_model(model_name)
        
        if success:
            print(f"✅ WORKING! Response: {message}")
            working_models.append(model_name)
        else:
            print(f"❌ {message}")
    
    print()
    print("=" * 70)
    
    if working_models:
        print(f"✅ Found {len(working_models)} working model(s)!")
        print()
        print("Recommended model to use:")
        print(f"  {working_models[0]}")
        print()
        print("To switch to this model:")
        print(f"  1. Edit backend/ai/views.py")
        print(f"  2. Replace 'gemini-2.5-flash' with '{working_models[0]}'")
        print(f"  3. Restart your server")
    else:
        print("❌ No working models found")
        print()
        print("All models have quota issues. Solutions:")
        print("  1. Create new API key: https://aistudio.google.com/apikey")
        print("  2. Wait 24 hours for quota reset")
        print("  3. Upgrade to paid plan")
    
    print("=" * 70)
