#!/usr/bin/env python
"""
Fix question subjects that were incorrectly mapped to general_science
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz

print("="*60)
print("🔧 Fixing Question Subject Mapping")
print("="*60)

# Get all questions with general_science
general_science_questions = Quiz.objects.filter(subject='general_science')
print(f"\nFound {general_science_questions.count()} questions with 'general_science' subject")

# For Classes 11-12, these are actually from different subjects
# Let's analyze the question text to determine the correct subject

fixed_count = 0
skipped_count = 0

for q in general_science_questions:
    question_text = q.question_text.lower()
    
    # Determine subject based on question content
    new_subject = None
    
    # Bangla indicators
    if any(word in question_text for word in ['oporichita', 'anupam', 'harish', 'shambhunath', 'tagore', 'রবীন্দ্রনাথ', 'অপরিচিতা']):
        new_subject = 'bangla_1st'
    elif any(word in question_text for word in ['bayannor', 'language movement', 'sheikh mujib', 'ভাষা আন্দোলন', '১৯৫২']):
        new_subject = 'bangla_1st'
    elif any(word in question_text for word in ['sonar tori', 'golden boat', 'bidrohi', 'rebel', 'সোনার তরী', 'বিদ্রোহী']):
        new_subject = 'bangla_1st'
    
    # English indicators
    elif any(word in question_text for word in ['hamlet', 'shakespeare', 'macbeth', 'othello', 'romeo']):
        new_subject = 'english_1st'
    elif any(word in question_text for word in ['grammar', 'tense', 'article', 'preposition', 'conjunction']):
        new_subject = 'english_2nd'
    
    # Physics indicators
    elif any(word in question_text for word in ['newton', 'force', 'velocity', 'acceleration', 'momentum', 'energy', 'power', 'work', 'motion', 'gravity']):
        new_subject = 'physics'
    elif any(word in question_text for word in ['circuit', 'current', 'voltage', 'resistance', 'ohm', 'electricity', 'magnetic']):
        new_subject = 'physics'
    elif any(word in question_text for word in ['wave', 'frequency', 'wavelength', 'sound', 'light', 'optics']):
        new_subject = 'physics'
    
    # Chemistry indicators
    elif any(word in question_text for word in ['atom', 'molecule', 'element', 'compound', 'periodic table', 'chemical', 'reaction']):
        new_subject = 'chemistry'
    elif any(word in question_text for word in ['acid', 'base', 'salt', 'ph', 'oxidation', 'reduction', 'redox']):
        new_subject = 'chemistry'
    elif any(word in question_text for word in ['carbon', 'hydrogen', 'oxygen', 'nitrogen', 'sodium', 'chlorine']):
        new_subject = 'chemistry'
    
    # Biology indicators
    elif any(word in question_text for word in ['cell', 'dna', 'rna', 'gene', 'chromosome', 'mitosis', 'meiosis']):
        new_subject = 'biology'
    elif any(word in question_text for word in ['plant', 'animal', 'photosynthesis', 'respiration', 'digestion']):
        new_subject = 'biology'
    elif any(word in question_text for word in ['bacteria', 'virus', 'fungi', 'organism', 'species', 'evolution']):
        new_subject = 'biology'
    
    # Mathematics indicators
    elif any(word in question_text for word in ['equation', 'algebra', 'calculus', 'derivative', 'integral', 'matrix']):
        new_subject = 'higher_math'
    elif any(word in question_text for word in ['triangle', 'circle', 'angle', 'geometry', 'theorem', 'proof']):
        new_subject = 'math'
    elif any(word in question_text for word in ['probability', 'statistics', 'mean', 'median', 'mode']):
        new_subject = 'math'
    
    # ICT indicators
    elif any(word in question_text for word in ['computer', 'programming', 'algorithm', 'database', 'html', 'css', 'javascript']):
        new_subject = 'ict'
    elif any(word in question_text for word in ['internet', 'network', 'software', 'hardware', 'binary']):
        new_subject = 'ict'
    
    if new_subject:
        q.subject = new_subject
        q.save()
        fixed_count += 1
        print(f"✅ Fixed Q{q.id}: {q.question_text[:50]}... → {new_subject}")
    else:
        skipped_count += 1
        # Keep as general_science if we can't determine
        print(f"⚠️  Skipped Q{q.id}: {q.question_text[:50]}... (keeping as general_science)")

print("\n" + "="*60)
print("📊 Summary")
print("="*60)
print(f"✅ Fixed: {fixed_count} questions")
print(f"⚠️  Skipped: {skipped_count} questions")

# Show updated distribution
print("\n" + "="*60)
print("📊 Updated Question Distribution")
print("="*60)

from django.db.models import Count
subjects = Quiz.objects.values('subject').annotate(count=Count('id')).order_by('subject')

for s in subjects:
    print(f"{s['subject']}: {s['count']} questions")

print("\n🎉 Subject mapping fix complete!")
