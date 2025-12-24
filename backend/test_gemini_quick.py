"""
Quick test of Gemini API with timeout
"""
import os
import warnings
warnings.filterwarnings('ignore')

import google.generativeai as genai
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import time

# Get API key from environment
api_key = "AIza_REDACTED"

print("Testing Gemini API...")
print(f"API Key: {api_key[:20]}...")

def test_gemini():
    """Test Gemini API call"""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = "Say 'Hello' in one word"
        print(f"\nSending prompt: {prompt}")
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            print(f"✅ Response: {response.text}")
            return True
        else:
            print("❌ No response")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

# Run with timeout
print("\nTesting with 10 second timeout...")
with ThreadPoolExecutor() as executor:
    future = executor.submit(test_gemini)
    try:
        result = future.result(timeout=10)
        if result:
            print("\n✅ Gemini API is working!")
        else:
            print("\n❌ Gemini API failed")
    except TimeoutError:
        print("\n❌ Gemini API call timed out after 10 seconds")
        print("   This suggests a network or API issue")
