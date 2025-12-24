"""
Test AI generation trigger for subjects with no/few questions
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User
from quizzes.models import Quiz
from django.test import RequestFactory
from quizzes.views import QuizListCreateView


def test_ai_generation():
    print("=" * 60)
    print("AI GENERATION TRIGGER TEST")
    print("=" * 60)
    
    # Get test user
    user = User.objects.filter(is_admin=True).first()
    if not user:
        user = User.objects.first()
    
    print(f"\n✅ Test User: {user.username}")
    
    # Test different subjects
    test_cases = [
        ('chemistry', 10, 'mcq'),
        ('history', 11, 'mcq'),
        ('geography', 12, 'mcq'),
        ('accounting', 11, 'short'),
    ]
    
    for subject, class_level, question_type in test_cases:
        print("\n" + "-" * 60)
        print(f"TEST: {subject.upper()} - Class {class_level} - Type: {question_type}")
        print("-" * 60)
        
        # Check existing questions
        existing = Quiz.objects.filter(
            subject=subject,
            class_target=class_level,
            question_type=question_type
        ).count()
        
        print(f"Existing {question_type} questions: {existing}")
        
        # Make API request
        factory = RequestFactory()
        request = factory.get(
            f'/api/quizzes/?subject={subject}&class_level={class_level}&question_types={question_type}'
        )
        request.user = user
        
        view = QuizListCreateView.as_view()
        response = view(request)
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.data
            results = data.get('results', data)
            source = data.get('source', 'database')
            
            print(f"Questions returned: {len(results)}")
            print(f"Source: {source}")
            
            if existing < 5:
                if source in ['ai_generated', 'mixed']:
                    print(f"✅ AI generation triggered (as expected for {existing} questions)")
                else:
                    print(f"❌ AI generation NOT triggered (expected for {existing} questions)")
            else:
                if source == 'database':
                    print(f"✅ Using database questions (as expected for {existing} questions)")
                else:
                    print(f"⚠️  AI generation triggered even with {existing} questions")
            
            # Check question types
            if results:
                types_returned = set(q.get('question_type') for q in results)
                print(f"Question types returned: {types_returned}")
                
                if question_type in types_returned and len(types_returned) == 1:
                    print(f"✅ Correct question type returned")
                else:
                    print(f"❌ Wrong question types: expected {question_type}, got {types_returned}")
        else:
            print(f"❌ Request failed")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    test_ai_generation()
