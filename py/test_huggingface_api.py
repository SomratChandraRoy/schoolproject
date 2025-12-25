"""
Test HuggingFace API to see if it's suitable for the project
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_huggingface_api():
    """Test HuggingFace Inference API"""
    
    print("=" * 70)
    print("Testing HuggingFace API")
    print("=" * 70)
    print()
    
    # Get API token
    api_token = os.getenv('HUGGINGFACE_API_TOKEN', 'hf_REDACTED')
    
    if not api_token:
        print("❌ ERROR: HUGGINGFACE_API_TOKEN not found")
        return False
    
    print(f"✓ API Token found: {api_token[:20]}...")
    print()
    
    # Test different models
    models_to_test = [
        {
            'name': 'meta-llama/Llama-3.2-3B-Instruct',
            'description': 'Llama 3.2 3B - Good for general tasks'
        },
        {
            'name': 'mistralai/Mistral-7B-Instruct-v0.3',
            'description': 'Mistral 7B - Good for instruction following'
        },
        {
            'name': 'google/gemma-2-2b-it',
            'description': 'Gemma 2 2B - Lightweight model'
        },
        {
            'name': 'Qwen/Qwen2.5-7B-Instruct',
            'description': 'Qwen 2.5 7B - Good multilingual support'
        }
    ]
    
    working_models = []
    
    for model_info in models_to_test:
        model_name = model_info['name']
        description = model_info['description']
        
        print(f"Testing: {model_name}")
        print(f"  {description}")
        
        try:
            # Test with a simple prompt
            headers = {
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "inputs": "Say 'Hello' in Bangla (one word only)",
                "parameters": {
                    "max_new_tokens": 10,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            }
            
            # Use new Inference Providers endpoint
            api_url = f"https://router.huggingface.co/v1/chat/completions"
            
            # Use chat completion format
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "user", "content": "Say 'Hello' in Bangla (one word only)"}
                ],
                "max_tokens": 10,
                "temperature": 0.7
            }
            
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                # Chat completion format
                if 'choices' in result and len(result['choices']) > 0:
                    generated_text = result['choices'][0]['message']['content']
                    print(f"  ✅ WORKING! Response: {generated_text[:50]}")
                    working_models.append(model_info)
                else:
                    print(f"  ⚠️  Unexpected response format: {result}")
                    
            elif response.status_code == 503:
                print(f"  ⏳ Model loading (503) - Try again in a minute")
            elif response.status_code == 429:
                print(f"  ❌ Rate limit exceeded")
            elif response.status_code == 402:
                print(f"  💰 Payment required - Not free")
            else:
                print(f"  ❌ Error {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"  ❌ Error: {str(e)[:100]}")
        
        print()
    
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print()
    
    if working_models:
        print(f"✅ Found {len(working_models)} working model(s)!")
        print()
        for model in working_models:
            print(f"  - {model['name']}")
            print(f"    {model['description']}")
            print()
    else:
        print("❌ No working models found")
        print()
        print("Possible reasons:")
        print("  1. Free tier credits exhausted ($0.10/month)")
        print("  2. Models require payment")
        print("  3. API token invalid")
        print("  4. Models still loading (503 errors)")
        print()
    
    # Check pricing info
    print("HuggingFace Pricing Info:")
    print("  - Free users: $0.10/month credits")
    print("  - PRO users: $2.00/month credits ($9/month subscription)")
    print("  - After credits: Pay-as-you-go")
    print()
    
    # Recommendation
    print("=" * 70)
    print("Recommendation for Your Project")
    print("=" * 70)
    print()
    
    if working_models:
        print("✅ HuggingFace CAN work for your project!")
        print()
        print("Pros:")
        print("  ✅ Multiple open-source models available")
        print("  ✅ Good multilingual support (Qwen, Llama)")
        print("  ✅ Can generate educational content")
        print()
        print("Cons:")
        print("  ❌ Very limited free tier ($0.10/month)")
        print("  ❌ Requires PRO subscription ($9/month) for $2 credits")
        print("  ❌ Pay-as-you-go after credits exhausted")
        print("  ❌ Models may be slower than Gemini")
        print("  ❌ Quality may vary by model")
        print()
        print("Comparison with current system:")
        print("  Current (Gemini): 160 requests/day FREE (8 keys)")
        print("  HuggingFace: ~$0.10/month = very few requests")
        print()
        print("💡 RECOMMENDATION: Keep using Gemini multi-key system")
        print("   HuggingFace is NOT better for your use case")
    else:
        print("❌ HuggingFace NOT suitable for your project")
        print()
        print("Reasons:")
        print("  ❌ Free tier too limited ($0.10/month)")
        print("  ❌ Models may not be working/available")
        print("  ❌ Requires payment for serious usage")
        print()
        print("💡 RECOMMENDATION: Stick with Gemini multi-key system")
        print("   You have 160 FREE requests/day with current setup")
    
    print("=" * 70)
    
    return len(working_models) > 0

if __name__ == '__main__':
    test_huggingface_api()
