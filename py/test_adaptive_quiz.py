"""
Test script for Adaptive Quiz System
Tests the complete flow: static questions → 90% threshold → AI generation
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User
from quizzes.models import Quiz, UserQuizProgress, AIGeneratedQuestion
from ai.question_generator import get_question_generator


def test_adaptive_quiz():
    print("=" * 60)
    print("ADAPTIVE QUIZ SYSTEM TEST")
    print("=" * 60)
    
    # Get a test user (admin)
    try:
        user = User.objects.filter(is_admin=True).first()
        if not user:
            user = User.objects.first()
        
        if not user:
            print("❌ No users found in database")
            return
        
        print(f"\n✅ Test User: {user.username} (Class {user.class_level})")
    except Exception as e:
        print(f"❌ Error getting user: {e}")
        return
    
    # Test parameters
    subject = 'physics'
    class_level = user.class_level or 9
    
    print(f"\n📚 Test Subject: {subject}")
    print(f"🎓 Test Class: {class_level}")
    
    # Check static questions
    print("\n" + "-" * 60)
    print("STEP 1: Checking Static Questions")
    print("-" * 60)
    
    static_questions = Quiz.objects.filter(
        subject=subject,
        class_target=class_level
    )
    
    print(f"Total static questions: {static_questions.count()}")
    
    if static_questions.count() == 0:
        print("⚠️  No static questions found. Creating test questions...")
        # Create some test questions
        for i in range(10):
            Quiz.objects.create(
                subject=subject,
                class_target=class_level,
                difficulty='medium',
                question_text=f"Test Physics Question {i+1}",
                question_type='mcq',
                options={'A': 'Option A', 'B': 'Option B', 'C': 'Option C', 'D': 'Option D'},
                correct_answer='Option A',
                explanation='Test explanation'
            )
        print(f"✅ Created 10 test questions")
        static_questions = Quiz.objects.filter(subject=subject, class_target=class_level)
    
    # Get or create progress
    print("\n" + "-" * 60)
    print("STEP 2: Initializing Progress Tracker")
    print("-" * 60)
    
    progress, created = UserQuizProgress.objects.get_or_create(
        user=user,
        subject=subject,
        class_level=class_level
    )
    
    if created:
        print("✅ Created new progress tracker")
    else:
        print("✅ Found existing progress tracker")
    
    # Set total static questions
    progress.total_static_questions = static_questions.count()
    progress.save()
    
    print(f"Status: {progress.status}")
    print(f"Static completed: {progress.static_questions_completed}/{progress.total_static_questions}")
    print(f"Completion: {progress.static_completion_percentage:.1f}%")
    print(f"Current difficulty: {progress.current_difficulty}")
    
    # Simulate 90% completion
    print("\n" + "-" * 60)
    print("STEP 3: Simulating 90% Completion")
    print("-" * 60)
    
    ninety_percent = int(progress.total_static_questions * 0.9)
    progress.static_questions_completed = ninety_percent
    progress.update_progress()
    
    print(f"✅ Set completion to {progress.static_questions_completed}/{progress.total_static_questions}")
    print(f"Completion percentage: {progress.static_completion_percentage:.1f}%")
    print(f"Status: {progress.status}")
    print(f"Should generate AI questions: {progress.should_generate_ai_questions()}")
    
    # Test AI question generation
    print("\n" + "-" * 60)
    print("STEP 4: Testing AI Question Generation")
    print("-" * 60)
    
    generator = get_question_generator()
    
    print("Generating 6 AI questions...")
    success, questions, error = generator.generate_batch_questions(
        user=user,
        subject=subject,
        class_level=class_level,
        difficulty=progress.current_difficulty,
        question_type='mcq',
        batch_size=6
    )
    
    if success:
        print(f"✅ Successfully generated {len(questions)} questions")
        for i, q in enumerate(questions, 1):
            print(f"\n  Question {i}:")
            print(f"  Text: {q.question_text[:80]}...")
            print(f"  Difficulty: {q.difficulty}")
            print(f"  Type: {q.question_type}")
            print(f"  Batch: {q.generation_batch}")
    else:
        print(f"❌ Failed to generate questions: {error}")
        return
    
    # Test getting next question
    print("\n" + "-" * 60)
    print("STEP 5: Testing Get Next Question")
    print("-" * 60)
    
    success, next_q, error = generator.get_next_question(
        user=user,
        subject=subject,
        class_level=class_level
    )
    
    if success:
        print(f"✅ Got next question:")
        print(f"  ID: {next_q.id}")
        print(f"  Text: {next_q.question_text[:80]}...")
        print(f"  Answered: {next_q.is_answered}")
    else:
        print(f"❌ Failed to get next question: {error}")
    
    # Test continuous generation
    print("\n" + "-" * 60)
    print("STEP 6: Testing Continuous Generation")
    print("-" * 60)
    
    # Mark some questions as answered
    ai_questions = AIGeneratedQuestion.objects.filter(
        user=user,
        subject=subject,
        class_level=class_level,
        is_answered=False
    )[:4]
    
    for q in ai_questions:
        q.is_answered = True
        q.is_correct = True
        q.save()
    
    print(f"✅ Marked 4 questions as answered")
    
    # Check if more questions are generated
    success, count, error = generator.check_and_generate_questions(
        user=user,
        subject=subject,
        class_level=class_level,
        difficulty=progress.current_difficulty,
        question_type='mcq'
    )
    
    if success:
        print(f"✅ Check complete. Generated {count} new questions")
    else:
        print(f"❌ Check failed: {error}")
    
    # Final statistics
    print("\n" + "-" * 60)
    print("FINAL STATISTICS")
    print("-" * 60)
    
    total_ai = AIGeneratedQuestion.objects.filter(
        user=user,
        subject=subject,
        class_level=class_level
    ).count()
    
    answered_ai = AIGeneratedQuestion.objects.filter(
        user=user,
        subject=subject,
        class_level=class_level,
        is_answered=True
    ).count()
    
    unanswered_ai = total_ai - answered_ai
    
    print(f"Total AI questions generated: {total_ai}")
    print(f"Answered: {answered_ai}")
    print(f"Unanswered: {unanswered_ai}")
    print(f"Progress status: {progress.status}")
    print(f"Current difficulty: {progress.current_difficulty}")
    
    print("\n" + "=" * 60)
    print("✅ ADAPTIVE QUIZ SYSTEM TEST COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    test_adaptive_quiz()
