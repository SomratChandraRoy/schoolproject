"""
Test script for question filtering and AI generation
Tests:
1. MCQ-only filter works correctly
2. AI generation triggers when no questions available
3. Question types are properly separated
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User
from quizzes.models import Quiz
from django.test import RequestFactory
from quizzes.views import QuizListCreateView


def test_question_filtering():
    print("=" * 60)
    print("QUESTION FILTERING TEST")
    print("=" * 60)
    
    # Get a test user
    user = User.objects.filter(is_admin=True).first()
    if not user:
        user = User.objects.first()
    
    if not user:
        print("❌ No users found")
        return
    
    print(f"\n✅ Test User: {user.username}")
    
    # Test 1: Check question types in database
    print("\n" + "-" * 60)
    print("TEST 1: Question Types in Database")
    print("-" * 60)
    
    subject = 'bangla_1st'
    class_level = 9
    
    all_questions = Quiz.objects.filter(
        subject=subject,
        class_target=class_level
    )
    
    mcq_count = all_questions.filter(question_type='mcq').count()
    short_count = all_questions.filter(question_type='short').count()
    long_count = all_questions.filter(question_type='long').count()
    
    print(f"Subject: {subject}, Class: {class_level}")
    print(f"Total questions: {all_questions.count()}")
    print(f"  - MCQ: {mcq_count}")
    print(f"  - Short: {short_count}")
    print(f"  - Long: {long_count}")
    
    # Test 2: Check MCQ validation
    print("\n" + "-" * 60)
    print("TEST 2: MCQ Options Validation")
    print("-" * 60)
    
    mcq_questions = all_questions.filter(question_type='mcq')
    valid_mcq = 0
    invalid_mcq = 0
    
    for q in mcq_questions:
        if isinstance(q.options, dict) and len(q.options) >= 2:
            valid_mcq += 1
        else:
            invalid_mcq += 1
            print(f"  ❌ Invalid MCQ ID {q.id}: options = {q.options}")
    
    print(f"Valid MCQ: {valid_mcq}")
    print(f"Invalid MCQ: {invalid_mcq}")
    
    # Test 3: Simulate API request for MCQ only
    print("\n" + "-" * 60)
    print("TEST 3: API Request - MCQ Only")
    print("-" * 60)
    
    factory = RequestFactory()
    request = factory.get(
        f'/api/quizzes/?subject={subject}&class_level={class_level}&question_types=mcq'
    )
    request.user = user
    
    view = QuizListCreateView.as_view()
    response = view(request)
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        results = data.get('results', data)
        
        print(f"Total questions returned: {len(results)}")
        
        # Check question types
        mcq_returned = sum(1 for q in results if q.get('question_type') == 'mcq')
        short_returned = sum(1 for q in results if q.get('question_type') == 'short')
        long_returned = sum(1 for q in results if q.get('question_type') == 'long')
        
        print(f"  - MCQ: {mcq_returned}")
        print(f"  - Short: {short_returned}")
        print(f"  - Long: {long_returned}")
        
        if short_returned > 0 or long_returned > 0:
            print("❌ FAIL: Non-MCQ questions returned when MCQ-only selected!")
        else:
            print("✅ PASS: Only MCQ questions returned")
        
        # Check source
        source = data.get('source', 'database')
        print(f"Source: {source}")
        
        if source in ['ai_generated', 'mixed']:
            print(f"✅ AI generation triggered")
    else:
        print(f"❌ Request failed with status {response.status_code}")
    
    # Test 4: Test with subject that has no questions
    print("\n" + "-" * 60)
    print("TEST 4: Subject with No Questions")
    print("-" * 60)
    
    # Find a subject with no questions
    test_subject = 'physics'
    test_class = 12
    
    existing = Quiz.objects.filter(
        subject=test_subject,
        class_target=test_class
    ).count()
    
    print(f"Subject: {test_subject}, Class: {test_class}")
    print(f"Existing questions: {existing}")
    
    if existing == 0:
        request = factory.get(
            f'/api/quizzes/?subject={test_subject}&class_level={test_class}&question_types=mcq'
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
            
            if source == 'ai_generated' and len(results) > 0:
                print("✅ PASS: AI generated questions for empty subject")
            else:
                print("❌ FAIL: AI generation did not work")
        else:
            print(f"❌ Request failed")
    else:
        print(f"⚠️  Skipping test - subject has {existing} questions")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    test_question_filtering()
