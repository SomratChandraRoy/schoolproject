#!/usr/bin/env python3
"""
Ollama Connection Test Script
আপনার AWS Ollama server test করার জন্য
"""

import requests
import base64
import json

# Configuration
AWS_URL = "http://16.171.19.161/api/generate"
AWS_TAGS_URL = "http://16.171.19.161/api/tags"
USERNAME = "bipul"
PASSWORD = REDACTED

# Create Basic Auth token
credentials = f"{USERNAME}:{PASSWORD}"
basic_auth = 'Basic ' + base64.b64encode(credentials.encode()).decode()

print("=" * 50)
print("  Ollama Connection Test")
print("=" * 50)
print()
print(f"Server URL: {AWS_URL}")
print(f"Username: {USERNAME}")
print(f"Auth Token: {basic_auth}")
print()

def test_server_availability():
    """Test 1: Server availability check"""
    print("🔍 Test 1: Checking server availability...")
    try:
        response = requests.get(
            AWS_TAGS_URL,
            headers={'Authorization': basic_auth},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            models = [m['name'] for m in data.get('models', [])]
            print("✅ Server is online!")
            print(f"Available models: {', '.join(models) if models else 'None'}")
            return True
        else:
            print(f"❌ Server responded with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print("❌ Cannot connect to server")
        print(f"Error: {str(e)}")
        return False

def test_generation():
    """Test 2: Simple generation test"""
    print("\n🔍 Test 2: Testing text generation...")
    try:
        response = requests.post(
            AWS_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': basic_auth
            },
            json={
                'model': 'llama3',
                'prompt': 'Say hello in one word',
                'stream': False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Generation successful!")
            print(f"Response: {data.get('response', 'No response')}")
            return True
        else:
            print(f"❌ Generation failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print("❌ Generation error")
        print(f"Error: {str(e)}")
        return False

def test_bangla_prompt():
    """Test 3: Bangla prompt test"""
    print("\n🔍 Test 3: Testing Bangla prompt...")
    try:
        response = requests.post(
            AWS_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': basic_auth
            },
            json={
                'model': 'llama3',
                'prompt': 'বাংলাদেশের রাজধানী কোথায়?',
                'stream': False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Bangla prompt successful!")
            print(f"Response: {data.get('response', 'No response')}")
            return True
        else:
            print(f"❌ Bangla prompt failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print("❌ Bangla prompt error")
        print(f"Error: {str(e)}")
        return False

def test_long_response():
    """Test 4: Long response test"""
    print("\n🔍 Test 4: Testing long response...")
    try:
        response = requests.post(
            AWS_URL,
            headers={
                'Content-Type': 'application/json',
                'Authorization': basic_auth
            },
            json={
                'model': 'llama3',
                'prompt': 'Explain what is artificial intelligence in 2 sentences',
                'stream': False
            },
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Long response successful!")
            print(f"Response: {data.get('response', 'No response')}")
            print(f"Response length: {len(data.get('response', ''))} characters")
            return True
        else:
            print(f"❌ Long response failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print("❌ Long response error")
        print(f"Error: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print("Starting tests...\n")
    
    test1 = test_server_availability()
    test2 = test_generation()
    test3 = test_bangla_prompt()
    test4 = test_long_response()
    
    print("\n" + "=" * 50)
    print("  Test Results")
    print("=" * 50)
    print(f"Server Availability: {'✅ PASS' if test1 else '❌ FAIL'}")
    print(f"Text Generation: {'✅ PASS' if test2 else '❌ FAIL'}")
    print(f"Bangla Prompt: {'✅ PASS' if test3 else '❌ FAIL'}")
    print(f"Long Response: {'✅ PASS' if test4 else '❌ FAIL'}")
    print()
    
    if all([test1, test2, test3, test4]):
        print("🎉 All tests passed! Your Ollama server is working perfectly!")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
        exit(1)
