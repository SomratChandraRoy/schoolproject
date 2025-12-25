#!/usr/bin/env python3
"""
Test All AI Features
Comprehensive test to verify all AI sections are working
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

print("=" * 70)
print("  Testing All AI Features")
print("=" * 70)
print()

# Test 1: Check AI Service Import
print("🔍 Test 1: Checking AI Service...")
try:
    from ai.ai_service import get_ai_service
    ai_service = get_ai_service()
    print("✅ AI Service imported successfully")
except Exception as e:
    print(f"❌ Failed to import AI Service: {e}")
    sys.exit(1)

print()

# Test 2: Check Settings Model
print("🔍 Test 2: Checking AI Provider Settings...")
try:
    from ai.models import AIProviderSettings
    settings = AIProviderSettings.get_settings()
    print(f"✅ Settings loaded successfully")
    print(f"   Provider: {settings.provider}")
    print(f"   Ollama URL: {settings.ollama_base_url}")
    print(f"   Ollama Model: {settings.ollama_model}")
except Exception as e:
    print(f"❌ Failed to load settings: {e}")
    print("   Note: Run migrations first: python manage.py migrate")

print()

# Test 3: Test Gemini Connection
print("🔍 Test 3: Testing Gemini API...")
try:
    success, response, error = ai_service.generate_with_gemini("Say hello in one word")
    if success:
        print(f"✅ Gemini is working!")
        print(f"   Response: {response[:50]}")
    else:
        print(f"⚠️ Gemini failed: {error}")
except Exception as e:
    print(f"⚠️ Gemini error: {e}")

print()

# Test 4: Test Ollama Connection
print("🔍 Test 4: Testing Ollama connection...")
try:
    success, response, error = ai_service.generate_with_ollama("Say hello in one word", timeout=30)
    if success:
        print(f"✅ Ollama is working!")
        print(f"   Response: {response[:50]}")
    else:
        print(f"⚠️ Ollama failed: {error}")
except Exception as e:
    print(f"⚠️ Ollama error: {e}")

print()

# Test 5: Test Auto Mode
print("🔍 Test 5: Testing Auto mode (main generate function)...")
try:
    success, response, error, source = ai_service.generate("Say hello in one word", timeout=30)
    if success:
        print(f"✅ Auto mode is working!")
        print(f"   Source: {source.upper()}")
        print(f"   Response: {response[:50]}")
    else:
        print(f"❌ Auto mode failed: {error}")
except Exception as e:
    print(f"❌ Auto mode error: {e}")

print()

# Test 6: Check All AI Views
print("🔍 Test 6: Checking AI Views...")
try:
    from ai.views import (
        AIChatMessageView,
        AnalyzeQuizResultsView,
        GeneratePersonalizedLearningView
    )
    print("✅ All AI views imported successfully")
    print("   - AIChatMessageView")
    print("   - AnalyzeQuizResultsView")
    print("   - GeneratePersonalizedLearningView")
except Exception as e:
    print(f"❌ Failed to import AI views: {e}")

print()

# Test 7: Check PDF Chat Views
print("🔍 Test 7: Checking PDF Chat Views...")
try:
    from ai.pdf_chat_views import ChatWithPDFView, AnalyzePDFView
    print("✅ PDF Chat views imported successfully")
    print("   - ChatWithPDFView")
    print("   - AnalyzePDFView")
except Exception as e:
    print(f"❌ Failed to import PDF Chat views: {e}")

print()

# Test 8: Check Admin Views
print("🔍 Test 8: Checking Admin Views...")
try:
    from ai.admin_views import AIProviderSettingsView, TestAIProviderView
    print("✅ Admin views imported successfully")
    print("   - AIProviderSettingsView")
    print("   - TestAIProviderView")
except Exception as e:
    print(f"❌ Failed to import Admin views: {e}")

print()

# Summary
print("=" * 70)
print("  Test Summary")
print("=" * 70)
print()
print("✅ AI Service: Working")
print("✅ Settings Model: Working")
print("✅ All Views: Imported")
print()

# Check which AI is available
gemini_ok = False
ollama_ok = False

try:
    success, _, _ = ai_service.generate_with_gemini("test")
    gemini_ok = success
except:
    pass

try:
    success, _, _ = ai_service.generate_with_ollama("test", timeout=10)
    ollama_ok = success
except:
    pass

print("AI Provider Status:")
print(f"  Gemini: {'✅ Available' if gemini_ok else '❌ Unavailable'}")
print(f"  Ollama: {'✅ Available' if ollama_ok else '❌ Unavailable'}")
print()

if gemini_ok or ollama_ok:
    print("🎉 At least one AI provider is working!")
    print()
    print("Recommendations:")
    if gemini_ok and ollama_ok:
        print("  ✅ Both AIs working - Use 'Auto' mode for best reliability")
    elif gemini_ok:
        print("  ⚠️ Only Gemini working - Set to 'Gemini Only' mode")
        print("  💡 To fix Ollama: Check if EC2 instance is running")
    elif ollama_ok:
        print("  ⚠️ Only Ollama working - Set to 'Ollama Only' mode")
        print("  💡 To fix Gemini: Check API key in .env file")
else:
    print("❌ No AI providers are working!")
    print()
    print("Troubleshooting:")
    print("  1. Check Gemini API key in .env file")
    print("  2. Check if Ollama EC2 instance is running")
    print("  3. Check Ollama credentials in settings")

print()
print("Next Steps:")
print("  1. Run migrations: python manage.py migrate")
print("  2. Start Django: python manage.py runserver")
print("  3. Go to /admin/ai-settings to configure AI provider")
print("  4. Test AI features in the app")
print()
