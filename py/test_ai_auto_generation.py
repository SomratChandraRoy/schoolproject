"""
Test automatic AI question generation when database has no questions
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.contrib.auth import get_user_model
from quizzes.models import Quiz
from ai.question_generator import get_question_generator

User = get_user_model()

def test_ai_generation():
    """Test AI generation for empty subject"""
    print("\n" + "="*60)
    print("Testing Automatic AI Question Generation")
    print("="*60)
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'class_level': 10,
            'is_active': True
        }
    )
    
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✓ Created test user: {user.username}")
    else:
        print(f"✓ Using existing user: {user.username}")
    
    # Test subject with no questions
    test_subject = 'history'
    test_class = 11
    test_type = 'mcq'
    
    # Check database
    db_count = Quiz.objects.filter(
        subject=test_subject,
        class_target=test_class,
        question_type=test_type
    ).count()
    
    print(f"\n📊 Database Status:")
    print(f"   Subject: {test_subject}")
    print(f"   Class: {test_class}")
    print(f"   Type: {test_type}")
    print(f"   Questions in DB: {db_count}")
    
    if db_count >= 5:
        print(f"\n⚠️  Database has {db_count} questions (≥5)")
        print("   AI generation won't trigger (threshold not met)")
        print("   Deleting some questions to test AI generation...")
        
        # Delete some questions to trigger AI generation
        Quiz.objects.filter(
            subject=test_subject,
            class_target=test_class,
            question_type=test_type
        ).delete()
        
        db_count = 0
        print(f"   ✓ Deleted questions, now have: {db_count}")
    
    # Test AI generation
    print(f"\n🤖 Testing AI Generation:")
    print(f"   Threshold: < 5 questions")
    print(f"   Current: {db_count} questions")
    print(f"   Should generate: {db_count < 5}")
    
    if db_count < 5:
        print(f"\n   Generating questions...")
        
        generator = get_question_generator()
        
        questions_needed = max(10 - db_count, 5)
        
        success, ai_questions, error = generator.generate_batch_questions(
            user=user,
            subject=test_subject,
            class_level=test_class,
            difficulty='medium',
            question_type=test_type,
            batch_size=questions_needed
        )
        
        if success:
            print(f"   ✅ SUCCESS: Generated {len(ai_questions)} AI questions")
            print(f"\n   Sample question:")
            if ai_questions:
                q = ai_questions[0]
                print(f"   - Text: {q.question_text[:80]}...")
                print(f"   - Type: {q.question_type}")
                print(f"   - Options: {len(q.options)} choices")
                print(f"   - Difficulty: {q.difficulty}")
        else:
            print(f"   ❌ FAILED: {error}")
            return False
    
    print(f"\n" + "="*60)
    print("✅ Test Complete")
    print("="*60)
    return True

if __name__ == '__main__':
    try:
        test_ai_generation()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
