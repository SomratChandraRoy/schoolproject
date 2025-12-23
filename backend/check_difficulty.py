#!/usr/bin/env python
"""
Check difficulty distribution
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz
from django.db.models import Count

print("="*60)
print("📊 Questions by Difficulty")
print("="*60)

diffs = Quiz.objects.values('difficulty').annotate(count=Count('id'))

for d in diffs:
    diff_name = d['difficulty'] if d['difficulty'] else 'None/Empty'
    print(f"{diff_name}: {d['count']} questions")

print("\n" + "="*60)
print("📊 Sample Questions with Difficulty")
print("="*60)

# Show samples
for diff in ['easy', 'medium', 'hard', None, '']:
    questions = Quiz.objects.filter(difficulty=diff)[:2]
    if questions:
        print(f"\n--- Difficulty: {diff or 'None/Empty'} ({questions.count()} total) ---")
        for q in questions:
            print(f"Q{q.id} (Class {q.class_target}, {q.subject}): {q.question_text[:60]}...")
