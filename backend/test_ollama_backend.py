#!/usr/bin/env python3
"""
Test Ollama connection from Django backend
Run this from the backend directory: python test_ollama_backend.py
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

# Now import after Django is setup
from ai.ollama_helper import get_ollama_helper

print("=" * 70)
print("  Testing Ollama Connection from Django Backend")
print("=" * 70)
print()

# Get Ollama helper
print("🔍 Initializing Ollama helper...")
ollama = get_ollama_helper()

print(f"   Base URL: {ollama.base_url}")
print(f"   Username: {ollama.username}")
print(f"   Model: {ollama.model}")
print()

# Test 1: Server Status
print("🔍 Test 1: Checking server status...")
if ollama.check_server_status():
    print("✅ Server is online!")
else:
    print("❌ Server is offline!")
    print()
    print("Troubleshooting:")
    print("1. Check if EC2 instance is running")
    print("2. Check if Ollama service is running: sudo systemctl status ollama")
    print("3. Check if Nginx is running: sudo systemctl status nginx")
    print("4. Check Security Group allows port 80")
    sys.exit(1)

print()

# Test 2: Simple Generation
print("🔍 Test 2: Testing text generation...")
prompt = "Say hello in one word"
success, response, error = ollama.generate(prompt, timeout=30)

if success:
    print(f"✅ Generation successful!")
    print(f"   Response: {response}")
else:
    print(f"❌ Generation failed!")
    print(f"   Error: {error}")
    sys.exit(1)

print()

# Test 3: Bangla Prompt
print("🔍 Test 3: Testing Bangla prompt...")
prompt = "বাংলাদেশের রাজধানী কোথায়? এক বাক্যে উত্তর দিন।"
success, response, error = ollama.generate(prompt, timeout=30)

if success:
    print(f"✅ Bangla prompt successful!")
    print(f"   Response: {response[:100]}...")
else:
    print(f"❌ Bangla prompt failed!")
    print(f"   Error: {error}")

print()

# Test 4: Educational Prompt (like AIChat)
print("🔍 Test 4: Testing educational prompt...")
prompt = """আপনি MedhaBangla এর AI শিক্ষা সহায়ক। একজন Class 9 এর শিক্ষার্থী জিজ্ঞাসা করেছে:

"গণিতে ভালো করার জন্য কী করতে হবে?"

সংক্ষেপে (2-3 বাক্যে) উত্তর দিন।"""

success, response, error = ollama.generate(prompt, timeout=60)

if success:
    print(f"✅ Educational prompt successful!")
    print(f"   Response: {response[:150]}...")
else:
    print(f"❌ Educational prompt failed!")
    print(f"   Error: {error}")

print()
print("=" * 70)
print("  Test Complete!")
print("=" * 70)
print()

if success:
    print("🎉 All tests passed! Django backend can connect to Ollama.")
    print()
    print("Next steps:")
    print("1. Start Django server: python manage.py runserver")
    print("2. Test AI features in the app")
else:
    print("⚠️ Some tests failed. Check the errors above.")
    sys.exit(1)
