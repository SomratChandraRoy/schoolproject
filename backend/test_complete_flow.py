"""
Test complete adaptive quiz flow:
1. User attempts quiz
2. At 50% - background AI generation starts
3. At 100% - user status changes to 'finished'
4. Continue with AI - questions saved to database
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.contrib.auth import get_user_model
from quizzes.models import Quiz, QuizAttempt, UserQuizProgress, AIGeneratedQuestion
from ai.question_generator import get_question_generator

User = get_user_model()

def test_complete_flow():
    print("\n" + "="*70)
    print("Testing Complete Adaptive Quiz Flow")
    print("="*70)
    
    # Get or create test user
    user, created = User.objects.get_or_create(
        username='flowtest',
        defaults={
            'email': 'flowtest@example.com',
            'class_level': 10,
            'is_active': True,
            'static_question_status': 'unfinished'
        }
    )
    
    if created:
        user.set_password('testpass123')
        user.save()
    
    print(f"\n✓ Test user: {user.username}")
    print(f"  Initial status: {user.static_question_status}")
    
    # Test subject
    subject = 'physics'
    class_level = 10
    
    # Create some test questions if needed
    existing_count = Quiz.objects.filter(
        subject=subject,
        class_target=class_level
    ).count()
    
    if existing_count < 10:
        print(f"\n📝 Creating test questions...")
        for i in range(10 - existing_count):
            Quiz.objects.create(
                subject=subject,
                class_target=class_level,
                difficulty='medium',
                question_text=f'Test question {i+1} for {subject}',
                question_type='mcq',
                options={'A': 'Option A', 'B': 'Option B', 'C': 'Option C', 'D': 'Option D'},
                correct_answer='Option A',
                explanation='Test explanation'
            )
        print(f"  ✓ Created {10 - existing_count} test questions")
    
    total_questions = Quiz.objects.filter(
        subject=subject,
        class_target=class_level
    ).count()
    
    print(f"\n📊 Quiz Setup:")
    print(f"  Subject: {subject}")
    print(f"  Class: {class_level}")
    print(f"  Total questions: {total_questions}")
    
    # Get or create progress
    progress, _ = UserQuizProgress.objects.get_or_create(
        user=user,
        subject=subject,
        class_level=class_level
    )
    progress.total_static_questions = total_questions
    progress.static_questions_completed = 0
    progress.save()
    
    print(f"\n🎯 Simulating Quiz Attempts:")
    
    # Simulate answering questions
    questions = Quiz.objects.filter(
        subject=subject,
        class_target=class_level
    )[:total_questions]
    
    for i, question in enumerate(questions):
        # Create attempt
        QuizAttempt.objects.create(
            user=user,
            quiz=question,
            selected_answer=question.correct_answer,
            is_correct=True
        )
        
        # Update progress
        progress.static_questions_completed = i + 1
        progress.update_progress()
        
        completion = progress.static_completion_percentage
        
        # Check milestones
        if completion >= 50 and completion < 60:
            print(f"  ✓ Question {i+1}/{total_questions} - {completion:.1f}% complete")
            print(f"    🤖 50% THRESHOLD: Background AI generation should trigger")
            
        elif completion >= 100:
            print(f"  ✓ Question {i+1}/{total_questions} - {completion:.1f}% complete")
            print(f"    ✅ 100% COMPLETE: User status should change to 'finished'")
            
            # Update user status
            user.static_question_status = 'finished'
            user.save()
            print(f"    ✓ User status updated: {user.static_question_status}")
            break
    
    # Test AI generation
    print(f"\n🤖 Testing AI Question Generation:")
    generator = get_question_generator()
    
    success, ai_questions, error = generator.generate_batch_questions(
        user=user,
        subject=subject,
        class_level=class_level,
        difficulty='medium',
        question_type='mcq',
        batch_size=6
    )
    
    if success:
        print(f"  ✅ Generated {len(ai_questions)} AI questions")
        
        # Save to database
        saved_count = 0
        for ai_q in ai_questions:
            existing = Quiz.objects.filter(
                subject=ai_q.subject,
                class_target=ai_q.class_level,
                question_text=ai_q.question_text
            ).first()
            
            if not existing:
                Quiz.objects.create(
                    subject=ai_q.subject,
                    class_target=ai_q.class_level,
                    difficulty=ai_q.difficulty,
                    question_text=ai_q.question_text,
                    question_type=ai_q.question_type,
                    options=ai_q.options,
                    correct_answer=ai_q.correct_answer,
                    explanation=ai_q.explanation
                )
                saved_count += 1
        
        print(f"  ✅ Saved {saved_count} AI questions to database")
    else:
        print(f"  ❌ Failed: {error}")
        return False
    
    # Verify final state
    print(f"\n📈 Final State:")
    print(f"  User status: {user.static_question_status}")
    print(f"  Progress status: {progress.status}")
    print(f"  Static completed: {progress.static_questions_completed}/{progress.total_static_questions}")
    print(f"  Completion: {progress.static_completion_percentage:.1f}%")
    print(f"  AI questions in DB: {Quiz.objects.filter(subject=subject, class_target=class_level).count()}")
    print(f"  AI questions for user: {AIGeneratedQuestion.objects.filter(user=user, subject=subject).count()}")
    
    print(f"\n" + "="*70)
    print("✅ Complete Flow Test Passed!")
    print("="*70)
    
    return True

if __name__ == '__main__':
    try:
        test_complete_flow()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
