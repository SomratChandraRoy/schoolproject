"""
Test script to verify MCQ options are properly handled
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import AIGeneratedQuestion, Quiz

print("=" * 60)
print("MCQ OPTIONS VALIDATION TEST")
print("=" * 60)

# Test 1: Check static MCQ questions
print("\n1. Checking Static MCQ Questions:")
static_mcq = Quiz.objects.filter(question_type='mcq')[:5]
for q in static_mcq:
    options = q.options if q.options else {}
    option_count = len(options) if isinstance(options, dict) else 0
    status = "✅ VALID" if option_count >= 2 else "❌ INVALID"
    print(f"   {status} - Question ID {q.id}: {option_count} options")
    if option_count > 0:
        print(f"      Options: {list(options.keys())}")

# Test 2: Check AI-generated MCQ questions
print("\n2. Checking AI-Generated MCQ Questions:")
ai_mcq = AIGeneratedQuestion.objects.filter(question_type='mcq')[:5]
if ai_mcq.exists():
    for q in ai_mcq:
        options = q.options if q.options else {}
        option_count = len(options) if isinstance(options, dict) else 0
        status = "✅ VALID" if option_count >= 2 else "❌ INVALID"
        answered = "Answered" if q.is_answered else "Pending"
        print(f"   {status} - Question ID {q.id} ({answered}): {option_count} options")
        if option_count > 0:
            print(f"      Options: {list(options.keys())}")
else:
    print("   No AI-generated MCQ questions found")

# Test 3: Summary
print("\n3. Summary:")
total_static = Quiz.objects.filter(question_type='mcq').count()
invalid_static = Quiz.objects.filter(question_type='mcq', options={}).count()
print(f"   Static MCQ Questions: {total_static} total, {invalid_static} invalid")

total_ai = AIGeneratedQuestion.objects.filter(question_type='mcq').count()
invalid_ai = 0
for q in AIGeneratedQuestion.objects.filter(question_type='mcq'):
    if not q.options or not isinstance(q.options, dict) or len(q.options) < 2:
        invalid_ai += 1
print(f"   AI MCQ Questions: {total_ai} total, {invalid_ai} invalid")

print("\n" + "=" * 60)
if invalid_static == 0 and invalid_ai == 0:
    print("✅ ALL MCQ QUESTIONS HAVE VALID OPTIONS")
else:
    print("⚠️  SOME MCQ QUESTIONS HAVE INVALID OPTIONS")
    print(f"   Run: python manage.py fix_ai_question_options")
print("=" * 60)
