#!/usr/bin/env python
"""
Check questions in database by subject
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz
from django.db.models import Count

print("="*60)
print("📊 Questions by Subject")
print("="*60)

subjects = Quiz.objects.values('subject').annotate(count=Count('id')).order_by('subject')

for s in subjects:
    print(f"{s['subject']}: {s['count']} questions")

print("\n" + "="*60)
print("📊 Questions by Class")
print("="*60)

classes = Quiz.objects.values('class_target').annotate(count=Count('id')).order_by('class_target')

for c in classes:
    print(f"Class {c['class_target']}: {c['count']} questions")

print("\n" + "="*60)
print("📊 Sample Questions")
print("="*60)

# Show first 5 questions
questions = Quiz.objects.all()[:5]
for q in questions:
    print(f"\nSubject: {q.subject}")
    print(f"Class: {q.class_target}")
    print(f"Question: {q.question_text[:100]}...")
