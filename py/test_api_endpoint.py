"""
Test the actual API endpoint for question generation
"""
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from ai.views import GenerateQuizQuestionView

User = get_user_model()

def test_api_endpoint():
    """Test the actual API endpoint"""
    
    print("=" * 70)
    print("Testing API Endpoint: /api/ai/generate-quiz/")
    print("=" * 70)
    print()
    
    try:
        # Create a test user (teacher)
        try:
            user = User.objects.get(username='test_teacher')
            print("✓ Using existing test user")
        except User.DoesNotExist:
            user = User.objects.create_user(
                username='test_teacher',
                email='test@example.com',
                password='testpass123',
                is_teacher=True
            )
            print("✓ Created test user")
        
        # Create request
        factory = RequestFactory()
        request_data = {
            'subject': 'math',
            'class_level': 9,
            'difficulty': 'medium',
            'question_type': 'mcq'
        }
        
        request = factory.post(
            '/api/ai/generate-quiz/',
            data=json.dumps(request_data),
            content_type='application/json'
        )
        request.user = user
        request._dont_enforce_csrf_checks = True  # Disable CSRF for testing
        
        print("✓ Request created")
        print(f"  - Subject: {request_data['subject']}")
        print(f"  - Class: {request_data['class_level']}")
        print(f"  - Difficulty: {request_data['difficulty']}")
        print(f"  - Type: {request_data['question_type']}")
        print()
        
        # Call the view
        print("Calling API endpoint...")
        view = GenerateQuizQuestionView.as_view()
        response = view(request)
        
        print()
        print(f"Response Status: {response.status_code}")
        print()
        
        if response.status_code == 201:
            print("✅ SUCCESS!")
            print()
            data = response.data
            print("Generated Question:")
            print("-" * 70)
            print(f"ID: {data.get('id')}")
            print(f"Question: {data.get('question_text', '')[:100]}...")
            print(f"Type: {data.get('question_type')}")
            print(f"Difficulty: {data.get('difficulty')}")
            print(f"Options: {list(data.get('options', {}).keys())}")
            print(f"Answer: {data.get('correct_answer', '')[:50]}")
            print("-" * 70)
        else:
            print("❌ FAILED")
            print()
            print("Error Response:")
            print("-" * 70)
            print(json.dumps(response.data, indent=2))
            print("-" * 70)
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 70)

if __name__ == '__main__':
    test_api_endpoint()
