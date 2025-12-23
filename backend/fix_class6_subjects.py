#!/usr/bin/env python
"""
Fix Class 6 question subjects
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz

print("="*60)
print("🔧 Fixing Class 6 Question Subjects")
print("="*60)

# Get all Class 6 questions with general_science
class6_questions = Quiz.objects.filter(class_target=6, subject='general_science')
print(f"\nFound {class6_questions.count()} Class 6 questions with 'general_science' subject")

fixed_count = 0

for q in class6_questions:
    question_text = q.question_text.lower()
    
    new_subject = None
    
    # Mathematics indicators (Bengali)
    if any(word in question_text for word in ['সংখ্যা', 'মৌলিক', 'যৌগিক', 'গুণনীয়ক', 'গুণিতক', 'ল.সা.গু', 'গ.সা.গু', 
                                                'চলক', 'বীজগাণিতিক', 'জ্যামিতি', 'বিন্দু', 'কোণ', 'ত্রিভুজ', 
                                                'চতুর্ভুজ', 'আয়তক্ষেত্র', 'বর্গ', 'ক্ষেত্রফল', 'পরিসীমা']):
        new_subject = 'math'
    
    # Bangladesh & Global Studies indicators (Bengali)
    elif any(word in question_text for word in ['বাংলাদেশ', 'স্বাধীনতা', 'বঙ্গবন্ধু', 'জাতির জনক', 'সমাজবিজ্ঞান', 
                                                  'হরপ্পা', 'মহাস্থানগড়', 'উয়ারী', 'চাকমা', 'গারো', 'সংবিধান',
                                                  'সিন্ধু', 'মিশরীয়', 'মেসোপটেমীয়', 'নববর্ষ', 'বুদ্ধিজীবী',
                                                  'মার্চ', 'জাতীয় সঙ্গীত', 'নাগরিক', 'মানচিত্র', 'এশিয়া',
                                                  'রাজধানী', 'যাযাবর', 'কৃষি']):
        new_subject = 'bangladesh_global'
    
    # ICT indicators (Bengali)
    elif any(word in question_text for word in ['তথ্য', 'কম্পিউটার', 'মেমোরি', 'ইনপুট', 'আউটপুট', 'বিট', 'বাইট',
                                                  'গুগল', 'ওয়ার্ড', 'সেভ', 'কপি', 'ইন্টারনেট', 'ইমেইল']):
        new_subject = 'ict'
    
    # Science indicators (Bengali)
    elif any(word in question_text for word in ['খাদ্য', 'শক্তি', 'ভিটামিন', 'রোগ', 'সংক্রামক', 'শ্রম', 'কায়িক', 'মানসিক']):
        new_subject = 'science'
    
    # Bangladesh & Global Studies - more indicators
    elif any(word in question_text for word in ['সঞ্চয়', 'শিল্পাচার্য', 'বন্ধু খাতা', 'মাতৃভাষা', 'পহেলা বৈশাখ', 'মঙ্গল শোভাযাত্রা']):
        new_subject = 'bangladesh_global'
    
    # Religion (if any)
    elif any(word in question_text for word in ['আকাইদ', 'ইসলাম', 'তাওহিদ', 'আল্লাহ', 'কালিমা']):
        new_subject = 'general_science'  # Keep as general for religion
    
    if new_subject and new_subject != 'general_science':
        q.subject = new_subject
        q.save()
        fixed_count += 1
        print(f"✅ Fixed Q{q.id}: {q.question_text[:50]}... → {new_subject}")

print("\n" + "="*60)
print("📊 Summary")
print("="*60)
print(f"✅ Fixed: {fixed_count} Class 6 questions")

# Show updated distribution
print("\n" + "="*60)
print("📊 Updated Question Distribution")
print("="*60)

from django.db.models import Count
subjects = Quiz.objects.values('subject').annotate(count=Count('id')).order_by('subject')

for s in subjects:
    print(f"{s['subject']}: {s['count']} questions")

print("\n🎉 Class 6 subject mapping fix complete!")
