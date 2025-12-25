#!/usr/bin/env python
"""
Fix all question subjects that were incorrectly mapped to general_science
Comprehensive fix for Classes 6-12
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz

print("="*60)
print("🔧 Fixing All Question Subject Mapping")
print("="*60)

# Get all questions with general_science
general_science_questions = Quiz.objects.filter(subject='general_science')
print(f"\nFound {general_science_questions.count()} questions with 'general_science' subject")

fixed_count = 0
skipped_count = 0

for q in general_science_questions:
    question_text = q.question_text.lower()
    class_num = q.class_target
    
    new_subject = None
    
    # ===== BENGALI KEYWORDS =====
    # Bangla 1st Paper (Bengali)
    if any(word in question_text for word in ['মিনু', 'ঝিংগে ফুল', 'মানুষ জাতি', 'সততার পুরস্কার', 'রবীন্দ্রনাথ', 
                                                'অপরিচিতা', 'সোনার তরী', 'বিদ্রোহী', 'কবিতা', 'গল্প', 'রচনা',
                                                'শুভা', 'জীবন-সঙ্গীত', 'কপোতাক্ষ নদ', 'বাংলা সাহিত্য']):
        new_subject = 'bangla_1st'
    
    # Bangla 2nd Paper (Grammar)
    elif any(word in question_text for word in ['সমাস', 'সন্ধি', 'প্রত্যয়', 'উপসর্গ', 'বিভক্তি', 'কারক', 'সমাসের',
                                                  'দ্বন্দ্ব সমাস', 'কর্মধারয়', 'তৎপুরুষ', 'বহুব্রীহি', 'অব্যয়ীভাব',
                                                  'ব্যাসবাক্য', 'বিদ্যালয়', 'সিংহাসন', 'ধূমপান']):
        new_subject = 'bangla_2nd'
    
    # Mathematics (Bengali)
    elif any(word in question_text for word in ['সংখ্যা', 'মৌলিক', 'যৌগিক', 'গুণনীয়ক', 'গুণিতক', 'ল.সা.গু', 'গ.সা.গু',
                                                  'চলক', 'বীজগাণিতিক', 'জ্যামিতি', 'বিন্দু', 'কোণ', 'ত্রিভুজ',
                                                  'চতুর্ভুজ', 'আয়তক্ষেত্র', 'বর্গ', 'ক্ষেত্রফল', 'পরিসীমা',
                                                  'tan60', 'ব্যাসার্ধ', 'বৃত্ত', 'সমীকরণ', 'x²', 'x³']):
        if class_num >= 11:
            new_subject = 'higher_math'
        else:
            new_subject = 'math'
    
    # Bangladesh & Global Studies (Bengali)
    elif any(word in question_text for word in ['বাংলাদেশ', 'স্বাধীনতা', 'বঙ্গবন্ধু', 'জাতির জনক', 'সমাজবিজ্ঞান',
                                                  'হরপ্পা', 'মহাস্থানগড়', 'উয়ারী', 'চাকমা', 'গারো', 'সংবিধান',
                                                  'সিন্ধু', 'মিশরীয়', 'মেসোপটেমীয়', 'নববর্ষ', 'বুদ্ধিজীবী',
                                                  'মার্চ', 'জাতীয় সঙ্গীত', 'নাগরিক', 'মানচিত্র', 'এশিয়া',
                                                  'রাজধানী', 'যাযাবর', 'কৃষি', 'সম্প্রদায়', 'সঞ্চয়', 'শিল্পাচার্য',
                                                  'পহেলা বৈশাখ', 'মঙ্গল শোভাযাত্রা', 'মাতৃভাষা', 'যৌক্তিক সিদ্ধান্ত']):
        new_subject = 'bangladesh_global'
    
    # ICT (Bengali & English)
    elif any(word in question_text for word in ['তথ্য', 'কম্পিউটার', 'মেমোরি', 'ইনপুট', 'আউটপুট', 'বিট', 'বাইট',
                                                  'গুগল', 'ওয়ার্ড', 'সেভ', 'কপি', 'ইন্টারনেট', 'ইমেইল',
                                                  'ফিশিং', 'phishing', 'স্প্রেডশিট', 'excel', 'পাসওয়ার্ড',
                                                  'পাইথন', 'python', 'print()', 'গিগ ইকোনমি', 'gig economy',
                                                  'চার্লস ব্যাবেজ', 'html', 'hyperlink', '<a>', 'dbms', 'database']):
        new_subject = 'ict'
    
    # Science (Bengali)
    elif any(word in question_text for word in ['খাদ্য', 'শক্তি', 'ভিটামিন', 'রোগ', 'সংক্রামক', 'শ্রম', 'কায়িক', 'মানসিক']):
        new_subject = 'science'
    
    # ===== ENGLISH KEYWORDS =====
    # English 1st Paper
    elif any(word in question_text for word in ['may day', 'strikers', 'eight-hour', 'shat gombuj', 'mosque', 'khan jahan',
                                                  'passage', 'summary', 'comprehension']):
        new_subject = 'english_1st'
    
    # English 2nd Paper
    elif any(word in question_text for word in ['tag question', 'let us go', 'shall we', 'maiden speech', 'transform',
                                                  'negative', 'man is mortal', 'cv', 'cover letter', 'assistant teacher']):
        new_subject = 'english_2nd'
    
    # Physics (English)
    elif any(word in question_text for word in ['acceleration', 'ms⁻²', 'myopia', 'concave', 'convex', 'lens',
                                                  'spring', 'potential energy', 'kinetic', 'inertia', 'newton',
                                                  'force', 'velocity', 'momentum', 'circuit', 'current', 'voltage',
                                                  'resistance', 'ohm', 'electricity', 'magnetic', 'wave', 'frequency',
                                                  'wavelength', 'sound', 'light', 'optics', 'universal gate', 'null vector']):
        new_subject = 'physics'
    
    # Chemistry (English)
    elif any(word in question_text for word in ['halogen', 'group 17', 'h₂so₄', 'mole', 'hydrocarbon', 'ethene',
                                                  'ethanol', 'limiting reactant', 'atom', 'molecule', 'element',
                                                  'compound', 'periodic table', 'chemical', 'reaction', 'acid',
                                                  'base', 'salt', 'ph', 'oxidation', 'reduction', 'carbon']):
        new_subject = 'chemistry'
    
    # Biology (English)
    elif any(word in question_text for word in ['mitochondria', 'powerhouse', 'cell', 'blood group', 'universal donor',
                                                  'dna', 'double helix', 'watson', 'crick', 'pepsin', 'stomach',
                                                  'digestion', 'rna', 'gene', 'chromosome', 'mitosis', 'meiosis',
                                                  'photosynthesis', 'respiration', 'bacteria', 'virus']):
        new_subject = 'biology'
    
    # Higher Mathematics (English)
    elif any(word in question_text for word in ['p(a)', 'probability', 'ncr', 'combination', 'factorial',
                                                  'triangle vertices', 'coordinate', 'area of triangle']):
        if class_num >= 11:
            new_subject = 'higher_math'
        else:
            new_subject = 'math'
    
    # Accounting (Bengali)
    elif any(word in question_text for word in ['চলতি সম্পদ', 'দেনাদার', 'মালিকানা স্বত্ব', 'equity', 'সম্পদ', 'দায়',
                                                  'রেওয়ামিল', 'আয় বিবরণী', 'মুনাফা']):
        new_subject = 'general_science'  # Keep as general for business subjects
    
    # Finance & Banking (Bengali)
    elif any(word in question_text for word in ['রুল ৭২', 'rule 72', 'চক্রবৃদ্ধি', 'সুদ', 'বিনিয়োগ', 'fv', 'pv']):
        new_subject = 'general_science'  # Keep as general for business subjects
    
    # History (Bengali)
    elif any(word in question_text for word in ['৬ দফা', 'ম্যাগনাকার্টা', 'নীল নদ', 'মিশরীয়', 'সুমেরীয়',
                                                  'মুক্তিযুদ্ধ', '১৬ই ডিসেম্বর', 'আত্মসমর্পণ']):
        new_subject = 'general_science'  # Keep as general for humanities subjects
    
    # Geography (Bengali)
    elif any(word in question_text for word in ['সূর্য', 'গ্রহ', 'বুধ', 'শুক্র', 'পৃথিবী', 'সৌরজগত', 'বায়ুমণ্ডল']):
        new_subject = 'general_science'  # Keep as general for geography
    
    # Economics (Bengali)
    elif any(word in question_text for word in ['পেঁয়াজ', 'চাহিদা', 'দাম', 'চাহিদাবিধি', 'রেখাচিত্র']):
        new_subject = 'general_science'  # Keep as general for economics
    
    # Religion (Bengali)
    elif any(word in question_text for word in ['ইসলাম', 'আত্মসমর্পণ', 'কুরআন', 'নাজিল', 'যাকাত', 'ধনী', 'দরিদ্র']):
        new_subject = 'general_science'  # Keep as general for religion
    
    if new_subject and new_subject != 'general_science':
        q.subject = new_subject
        q.save()
        fixed_count += 1
        print(f"✅ Fixed Q{q.id} (Class {class_num}): {q.question_text[:60]}... → {new_subject}")
    else:
        skipped_count += 1

print("\n" + "="*60)
print("📊 Summary")
print("="*60)
print(f"✅ Fixed: {fixed_count} questions")
print(f"⚠️  Skipped: {skipped_count} questions (kept as general_science)")

# Show updated distribution
print("\n" + "="*60)
print("📊 Updated Question Distribution")
print("="*60)

from django.db.models import Count
subjects = Quiz.objects.values('subject').annotate(count=Count('id')).order_by('subject')

for s in subjects:
    print(f"{s['subject']}: {s['count']} questions")

print("\n" + "="*60)
print("📊 Questions by Class")
print("="*60)

classes = Quiz.objects.values('class_target').annotate(count=Count('id')).order_by('class_target')

for c in classes:
    print(f"Class {c['class_target']}: {c['count']} questions")

print("\n🎉 Subject mapping fix complete!")
