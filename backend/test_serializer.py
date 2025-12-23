#!/usr/bin/env python
"""
Test the QuizSerializer options conversion
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.serializers import QuizSerializer
from quizzes.models import Quiz

print("="*60)
print("🧪 Testing QuizSerializer Options Conversion")
print("="*60)

# Get a sample question
q = Quiz.objects.filter(subject='bangla_1st', class_target=6).first()

if q:
    print(f"\n📝 Original Question:")
    print(f"ID: {q.id}")
    print(f"Text: {q.question_text[:60]}...")
    print(f"Options (DB): {q.options}")
    print(f"Options Type (DB): {type(q.options)}")
    
    # Serialize it
    serializer = QuizSerializer(q)
    
    print(f"\n✨ Serialized Data:")
    print(f"Options (API): {serializer.data['options']}")
    print(f"Options Type (API): {type(serializer.data['options'])}")
    
    if isinstance(serializer.data['options'], list):
        print(f"\n✅ SUCCESS! Options converted to array")
        print(f"Number of options: {len(serializer.data['options'])}")
        for i, opt in enumerate(serializer.data['options'], 1):
            print(f"  {i}. {opt}")
    else:
        print(f"\n❌ FAILED! Options still a dict")
else:
    print("No questions found!")

print("\n" + "="*60)
