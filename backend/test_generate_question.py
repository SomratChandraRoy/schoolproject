"""
Test question generation with the multi-key system
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.conf import settings
from ai.api_key_manager import get_key_manager

def test_question_generation():
    """Test generating a question"""
    
    print("=" * 70)
    print("Testing Question Generation with Multi-Key System")
    print("=" * 70)
    print()
    
    try:
        # Get key manager
        key_manager = get_key_manager()
        print("✓ Key manager loaded")
        
        # Show status
        status = key_manager.get_status()
        print(f"✓ Total keys: {status['total_keys']}")
        print(f"✓ Current key: #{status['current_key_index']}")
        print()
        
        # Create a test prompt (same as in views.py)
        prompt = """You are an expert educational content creator for the Bangladeshi education system.
Generate a medium level mcq question for Class 9 students in math.

Requirements:
1. The question MUST be curriculum-appropriate for Bangladesh's national curriculum
2. For MCQ questions, provide exactly 4 options (A, B, C, D) with one correct answer
3. For short answer questions, provide a brief model answer
4. For long answer questions, provide a detailed answer outline
5. Include a clear explanation of the concept being tested
6. Use Bangla for subjects where it's more appropriate

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
    "question_text": "The question text here",
    "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
    "correct_answer": "The correct answer",
    "explanation": "Detailed explanation of the concept"
}

For non-MCQ questions, set "options" to an empty object {}."""
        
        print("Generating question...")
        print()
        
        # Generate content
        success, response, error = key_manager.generate_content(
            prompt=prompt,
            model_name='gemini-2.5-flash-lite'
        )
        
        if success:
            print("✅ SUCCESS!")
            print()
            print("Response (first 500 chars):")
            print("-" * 70)
            print(response[:500])
            print("-" * 70)
            print()
            
            # Try to parse JSON
            import json
            import re
            
            try:
                # Remove markdown if present
                clean_response = response
                if clean_response.startswith('```'):
                    clean_response = re.sub(r'^```(?:json)?\n?', '', clean_response)
                    clean_response = re.sub(r'\n?```$', '', clean_response)
                
                question_data = json.loads(clean_response)
                
                print("✅ JSON parsed successfully!")
                print()
                print("Question:", question_data.get('question_text', 'N/A')[:100])
                print("Options:", list(question_data.get('options', {}).keys()))
                print("Answer:", question_data.get('correct_answer', 'N/A')[:50])
                print()
                
            except Exception as parse_error:
                print(f"⚠️  JSON parsing failed: {str(parse_error)}")
                print("But API call was successful!")
                print()
            
            # Show final status
            final_status = key_manager.get_status()
            print("Final Key Manager Status:")
            print(f"  - Current key: #{final_status['current_key_index']}")
            print(f"  - Failed keys: {final_status['failed_keys_count']}")
            print(f"  - Available keys: {final_status['available_keys_count']}")
            
        else:
            print("❌ FAILED")
            print()
            print(f"Error: {error}")
            print()
            
            # Show status
            final_status = key_manager.get_status()
            print("Key Manager Status:")
            print(f"  - Total keys: {final_status['total_keys']}")
            print(f"  - Failed keys: {final_status['failed_keys_count']}")
            print(f"  - All exhausted: {final_status['all_keys_exhausted']}")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 70)

if __name__ == '__main__':
    test_question_generation()
