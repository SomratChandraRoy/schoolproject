#!/usr/bin/env python
"""
Test Ollama AI Connection
This script tests if the Ollama server is accessible and working
"""
import os
import sys
import django
import requests
import base64
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.conf import settings

def test_ollama_connection():
    """Test Ollama server connection and response"""
    
    print("=" * 60)
    print("🤖 OLLAMA AI CONNECTION TEST")
    print("=" * 60)
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get configuration from .env
    ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://16.171.19.161')
    ollama_username = os.getenv('OLLAMA_USERNAME', 'bipul')
    ollama_password = os.getenv('OLLAMA_PASSWORD', 'Bipul$Ollama$Roy$2026$')
    ollama_model = os.getenv('OLLAMA_MODEL', 'llama3')
    
    print("📋 Configuration:")
    print(f"   Base URL: {ollama_base_url}")
    print(f"   Username: {ollama_username}")
    print(f"   Password: {'*' * len(ollama_password)}")
    print(f"   Model: {ollama_model}")
    print()
    
    # Test 1: Check if server is reachable
    print("🔍 Test 1: Checking server connectivity...")
    try:
        response = requests.get(f"{ollama_base_url}/", timeout=5)
        print(f"   ✅ Server is reachable (Status: {response.status_code})")
    except requests.exceptions.Timeout:
        print("   ❌ Server timeout - Server is not responding")
        return False
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection error - Cannot reach server")
        print("   💡 Possible issues:")
        print("      - EC2 instance might be stopped")
        print("      - Security group might be blocking access")
        print("      - Wrong IP address")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False
    
    print()
    
    # Test 2: Test authentication
    print("🔐 Test 2: Testing authentication...")
    try:
        credentials = f"{ollama_username}:{ollama_password}"
        basic_auth = 'Basic ' + base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': basic_auth
        }
        
        print("   ✅ Authentication header created")
    except Exception as e:
        print(f"   ❌ Error creating auth: {str(e)}")
        return False
    
    print()
    
    # Test 3: Test API endpoint
    print("🧪 Test 3: Testing Ollama API with simple prompt...")
    test_prompt = "Say 'Hello, I am working!' in one sentence."
    
    try:
        print(f"   📤 Sending prompt: '{test_prompt}'")
        print("   ⏳ Waiting for response (timeout: 30s)...")
        
        response = requests.post(
            f"{ollama_base_url}/api/generate",
            headers=headers,
            json={
                'model': ollama_model,
                'prompt': test_prompt,
                'stream': False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            ai_response = data.get('response', '')
            
            print(f"   ✅ Success! (Status: {response.status_code})")
            print()
            print("   📥 AI Response:")
            print("   " + "-" * 56)
            print(f"   {ai_response}")
            print("   " + "-" * 56)
            print()
            
            # Show additional info
            if 'model' in data:
                print(f"   📊 Model used: {data['model']}")
            if 'total_duration' in data:
                duration_sec = data['total_duration'] / 1_000_000_000
                print(f"   ⏱️  Response time: {duration_sec:.2f} seconds")
            
            return True
            
        elif response.status_code == 401:
            print(f"   ❌ Authentication failed (Status: {response.status_code})")
            print("   💡 Check username and password in .env file")
            return False
            
        elif response.status_code == 404:
            print(f"   ❌ Model not found (Status: {response.status_code})")
            print(f"   💡 Model '{ollama_model}' might not be installed on server")
            return False
            
        else:
            print(f"   ❌ API error (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("   ❌ Request timeout - Server took too long to respond")
        print("   💡 Possible issues:")
        print("      - Model is loading (first request can be slow)")
        print("      - Server is overloaded")
        print("      - Network is slow")
        return False
        
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection error during API call")
        return False
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def test_with_ai_service():
    """Test using the AI service class"""
    print()
    print("=" * 60)
    print("🔧 Test 4: Testing with AI Service class...")
    print("=" * 60)
    print()
    
    try:
        from ai.ai_service import AIService
        
        ai_service = AIService()
        test_prompt = "What is 2+2? Answer in one short sentence."
        
        print(f"   📤 Sending prompt: '{test_prompt}'")
        print("   ⏳ Waiting for response...")
        
        success, response, error = ai_service.generate_with_ollama(test_prompt, timeout=30)
        
        if success:
            print("   ✅ AI Service test successful!")
            print()
            print("   📥 AI Response:")
            print("   " + "-" * 56)
            print(f"   {response}")
            print("   " + "-" * 56)
            return True
        else:
            print(f"   ❌ AI Service test failed: {error}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print()
    
    # Run tests
    test1_passed = test_ollama_connection()
    test2_passed = test_with_ai_service()
    
    # Summary
    print()
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"   Direct API Test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"   AI Service Test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print()
    
    if test1_passed and test2_passed:
        print("🎉 ALL TESTS PASSED - Ollama is working correctly!")
        print()
        print("✅ You can now use Ollama AI in your application:")
        print("   - Chat feature")
        print("   - AI-generated questions")
        print("   - Remedial explanations")
        print()
        sys.exit(0)
    else:
        print("⚠️  SOME TESTS FAILED - Please check the errors above")
        print()
        print("💡 Common solutions:")
        print("   1. Check if EC2 instance is running")
        print("   2. Verify credentials in .env file")
        print("   3. Check security group allows your IP")
        print("   4. Try accessing the URL in browser")
        print()
        sys.exit(1)
