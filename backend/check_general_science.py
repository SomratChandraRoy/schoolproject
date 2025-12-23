#!/usr/bin/env python
"""
Check general_science questions by class
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz
from django.db.models import Count

print("="*60)
print("📊 General Science Questions by Class")
print("="*60)

qs = Quiz.objects.filter(subject='general_science').values('class_target').annotate(count=Count('id')).order_by('class_target')

for q in qs:
    print(f"Class {q['class_target']}: {q['count']} questions")

print("\n" + "="*60)
print("📊 Sample General Science Questions")
print("="*60)

# Show samples from each class
for class_num in [6, 7, 8, 9, 10, 11, 12]:
    questions = Quiz.objects.filter(class_target=class_num, subject='general_science')[:3]
    if questions:
        print(f"\n--- Class {class_num} ---")
        for q in questions:
            print(f"Q{q.id}: {q.question_text[:80]}...")
