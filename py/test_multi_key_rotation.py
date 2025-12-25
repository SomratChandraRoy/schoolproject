"""
Test script for multi-API-key rotation system
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.conf import settings
from ai.api_key_manager import GeminiAPIKeyManager

def test_key_rotation():
    """Test the key rotation system"""
    
    print("=" * 70)
    print("Testing Multi-API-Key Rotation System")
    print("=" * 70)
    print()
    
    # Get API keys from settings
    api_keys = settings.GEMINI_API_KEYS
    
    print(f"✓ Loaded {len(api_keys)} API keys from settings")
    print()
    
    # Initialize key manager
    key_manager = GeminiAPIKeyManager(api_keys)
    
    # Test simple prompt
    test_prompt = "Say 'Hello' in Bangla (one word only)"
    
    print(f"Testing with prompt: '{test_prompt}'")
    print()
    
    success, response, error = key_manager.generate_content(
        prompt=test_prompt,
        model_name='gemini-2.5-flash-lite'  # Using lite version which has quota
    )
    
    if success:
        print("✅ SUCCESS!")
        print(f"Response: {response[:100]}")
        print()
        
        # Show status
        status_info = key_manager.get_status()
        print("Key Manager Status:")
        print(f"  - Total keys: {status_info['total_keys']}")
        print(f"  - Current key: #{status_info['current_key_index']}")
        print(f"  - Failed keys: {status_info['failed_keys_count']}")
        print(f"  - Available keys: {status_info['available_keys_count']}")
        
    else:
        print("❌ FAILED")
        print(f"Error: {error}")
        print()
        
        # Show status
        status_info = key_manager.get_status()
        print("Key Manager Status:")
        print(f"  - Total keys: {status_info['total_keys']}")
        print(f"  - Failed keys: {status_info['failed_keys_count']}")
        print(f"  - All keys exhausted: {status_info['all_keys_exhausted']}")
    
    print()
    print("=" * 70)
    
    if success:
        print("✅ Multi-key rotation system is working!")
        print()
        print("The system will automatically:")
        print("  1. Try the first API key")
        print("  2. If quota exceeded, rotate to next key")
        print("  3. Continue until finding a working key")
        print("  4. Report when all keys are exhausted")
    else:
        print("⚠️  All API keys have quota issues")
        print()
        print("Solutions:")
        print("  1. Wait 24 hours for quota reset")
        print("  2. Add more API keys to .env file")
        print("  3. Use Puter.js for unlimited free access")
    
    print("=" * 70)

if __name__ == '__main__':
    test_key_rotation()
