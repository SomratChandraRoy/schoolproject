#!/usr/bin/env python
"""
Populate Subject table with all subjects for Classes 6-12
Based on A.C.Q/A.C.S.md
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Subject

# Clear existing subjects
Subject.objects.all().delete()
print("🗑️  Cleared existing subjects")

# Define subjects for each class
subjects_data = [
    # Class 6
    {"name": "Bangla 1st Paper", "bengali_title": "চারুপাঠ", "subject_code": "bangla_1st", "class_level": 6, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "বাংলা ব্যাকরণ ও নির্মিতি", "subject_code": "bangla_2nd", "class_level": 6, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English For Today", "subject_code": "english_1st", "class_level": 6, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar & Composition", "subject_code": "english_2nd", "class_level": 6, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "Mathematics", "bengali_title": "গণিত", "subject_code": "math", "class_level": 6, "is_compulsory": True, "icon": "🔢", "color": "bg-purple-100"},
    {"name": "Science", "bengali_title": "বিজ্ঞান", "subject_code": "science", "class_level": 6, "is_compulsory": True, "icon": "🔬", "color": "bg-yellow-100"},
    {"name": "Bangladesh & Global Studies", "bengali_title": "বাংলাদেশ ও বিশ্বপরিচয়", "subject_code": "bangladesh_global", "class_level": 6, "is_compulsory": True, "icon": "🌍", "color": "bg-red-100"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 6, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    
    # Class 7
    {"name": "Bangla 1st Paper", "bengali_title": "সপ্তবর্ণা", "subject_code": "bangla_1st", "class_level": 7, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "বাংলা ব্যাকরণ ও নির্মিতি", "subject_code": "bangla_2nd", "class_level": 7, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English For Today", "subject_code": "english_1st", "class_level": 7, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar & Composition", "subject_code": "english_2nd", "class_level": 7, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "Mathematics", "bengali_title": "গণিত", "subject_code": "math", "class_level": 7, "is_compulsory": True, "icon": "🔢", "color": "bg-purple-100"},
    {"name": "Science", "bengali_title": "বিজ্ঞান", "subject_code": "science", "class_level": 7, "is_compulsory": True, "icon": "🔬", "color": "bg-yellow-100"},
    {"name": "Bangladesh & Global Studies", "bengali_title": "বাংলাদেশ ও বিশ্বপরিচয়", "subject_code": "bangladesh_global", "class_level": 7, "is_compulsory": True, "icon": "🌍", "color": "bg-red-100"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 7, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    
    # Class 8
    {"name": "Bangla 1st Paper", "bengali_title": "সাহিত্য কণিকা", "subject_code": "bangla_1st", "class_level": 8, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "বাংলা ব্যাকরণ ও নির্মিতি", "subject_code": "bangla_2nd", "class_level": 8, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English For Today", "subject_code": "english_1st", "class_level": 8, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar & Composition", "subject_code": "english_2nd", "class_level": 8, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "Mathematics", "bengali_title": "গণিত", "subject_code": "math", "class_level": 8, "is_compulsory": True, "icon": "🔢", "color": "bg-purple-100"},
    {"name": "Science", "bengali_title": "বিজ্ঞান", "subject_code": "science", "class_level": 8, "is_compulsory": True, "icon": "🔬", "color": "bg-yellow-100"},
    {"name": "Bangladesh & Global Studies", "bengali_title": "বাংলাদেশ ও বিশ্বপরিচয়", "subject_code": "bangladesh_global", "class_level": 8, "is_compulsory": True, "icon": "🌍", "color": "bg-red-100"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 8, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    
    # Class 9-10 Common Subjects
    {"name": "Bangla 1st Paper", "bengali_title": "সাহিত্য কণিকা", "subject_code": "bangla_1st", "class_level": 9, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "বাংলা ব্যাকরণ ও নির্মিতি", "subject_code": "bangla_2nd", "class_level": 9, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English For Today", "subject_code": "english_1st", "class_level": 9, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar & Composition", "subject_code": "english_2nd", "class_level": 9, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 9, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    
    # Class 9 Science Stream
    {"name": "Physics", "bengali_title": "পদার্থবিজ্ঞান", "subject_code": "physics", "class_level": 9, "stream": "Science", "is_compulsory": False, "icon": "⚛️", "color": "bg-blue-300"},
    {"name": "Chemistry", "bengali_title": "রসায়ন", "subject_code": "chemistry", "class_level": 9, "stream": "Science", "is_compulsory": False, "icon": "🧪", "color": "bg-green-300"},
    {"name": "Biology", "bengali_title": "জীববিজ্ঞান", "subject_code": "biology", "class_level": 9, "stream": "Science", "is_compulsory": False, "icon": "🧬", "color": "bg-green-400"},
    {"name": "Higher Mathematics", "bengali_title": "উচ্চতর গণিত", "subject_code": "higher_math", "class_level": 9, "stream": "Science", "is_compulsory": False, "icon": "📐", "color": "bg-purple-300"},
    {"name": "Mathematics", "bengali_title": "গণিত", "subject_code": "math", "class_level": 9, "stream": "Science", "is_compulsory": False, "icon": "🔢", "color": "bg-purple-100"},
    
    # Class 9 Humanities Stream
    {"name": "History", "bengali_title": "ইতিহাস", "subject_code": "history", "class_level": 9, "stream": "Humanities", "is_compulsory": False, "icon": "📜", "color": "bg-yellow-200"},
    {"name": "Geography", "bengali_title": "ভূগোল", "subject_code": "geography", "class_level": 9, "stream": "Humanities", "is_compulsory": False, "icon": "🗺️", "color": "bg-green-500"},
    {"name": "Civics", "bengali_title": "পৌরনীতি", "subject_code": "civics", "class_level": 9, "stream": "Humanities", "is_compulsory": False, "icon": "⚖️", "color": "bg-red-200"},
    {"name": "General Science", "bengali_title": "সাধারণ বিজ্ঞান", "subject_code": "general_science", "class_level": 9, "stream": "Humanities", "is_compulsory": False, "icon": "🔬", "color": "bg-yellow-100"},
    
    # Class 9 Business Stream
    {"name": "Accounting", "bengali_title": "হিসাববিজ্ঞান", "subject_code": "accounting", "class_level": 9, "stream": "Business", "is_compulsory": False, "icon": "💰", "color": "bg-yellow-300"},
    {"name": "Finance & Banking", "bengali_title": "ফিন্যান্স ও ব্যাংকিং", "subject_code": "finance", "class_level": 9, "stream": "Business", "is_compulsory": False, "icon": "🏦", "color": "bg-green-600"},
    {"name": "Business Entrepreneurship", "bengali_title": "ব্যবসায় উদ্যোগ", "subject_code": "business", "class_level": 9, "stream": "Business", "is_compulsory": False, "icon": "💼", "color": "bg-blue-400"},
    
    # Class 10 (Same as Class 9)
    {"name": "Bangla 1st Paper", "bengali_title": "সাহিত্য কণিকা", "subject_code": "bangla_1st", "class_level": 10, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "বাংলা ব্যাকরণ ও নির্মিতি", "subject_code": "bangla_2nd", "class_level": 10, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English For Today", "subject_code": "english_1st", "class_level": 10, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar & Composition", "subject_code": "english_2nd", "class_level": 10, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 10, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    {"name": "Physics", "bengali_title": "পদার্থবিজ্ঞান", "subject_code": "physics", "class_level": 10, "stream": "Science", "is_compulsory": False, "icon": "⚛️", "color": "bg-blue-300"},
    {"name": "Chemistry", "bengali_title": "রসায়ন", "subject_code": "chemistry", "class_level": 10, "stream": "Science", "is_compulsory": False, "icon": "🧪", "color": "bg-green-300"},
    {"name": "Biology", "bengali_title": "জীববিজ্ঞান", "subject_code": "biology", "class_level": 10, "stream": "Science", "is_compulsory": False, "icon": "🧬", "color": "bg-green-400"},
    {"name": "Higher Mathematics", "bengali_title": "উচ্চতর গণিত", "subject_code": "higher_math", "class_level": 10, "stream": "Science", "is_compulsory": False, "icon": "📐", "color": "bg-purple-300"},
    {"name": "Mathematics", "bengali_title": "গণিত", "subject_code": "math", "class_level": 10, "stream": "Science", "is_compulsory": False, "icon": "🔢", "color": "bg-purple-100"},
    {"name": "History", "bengali_title": "ইতিহাস", "subject_code": "history", "class_level": 10, "stream": "Humanities", "is_compulsory": False, "icon": "📜", "color": "bg-yellow-200"},
    {"name": "Geography", "bengali_title": "ভূগোল", "subject_code": "geography", "class_level": 10, "stream": "Humanities", "is_compulsory": False, "icon": "🗺️", "color": "bg-green-500"},
    {"name": "Civics", "bengali_title": "পৌরনীতি", "subject_code": "civics", "class_level": 10, "stream": "Humanities", "is_compulsory": False, "icon": "⚖️", "color": "bg-red-200"},
    {"name": "General Science", "bengali_title": "সাধারণ বিজ্ঞান", "subject_code": "general_science", "class_level": 10, "stream": "Humanities", "is_compulsory": False, "icon": "🔬", "color": "bg-yellow-100"},
    {"name": "Accounting", "bengali_title": "হিসাববিজ্ঞান", "subject_code": "accounting", "class_level": 10, "stream": "Business", "is_compulsory": False, "icon": "💰", "color": "bg-yellow-300"},
    {"name": "Finance & Banking", "bengali_title": "ফিন্যান্স ও ব্যাংকিং", "subject_code": "finance", "class_level": 10, "stream": "Business", "is_compulsory": False, "icon": "🏦", "color": "bg-green-600"},
    {"name": "Business Entrepreneurship", "bengali_title": "ব্যবসায় উদ্যোগ", "subject_code": "business", "class_level": 10, "stream": "Business", "is_compulsory": False, "icon": "💼", "color": "bg-blue-400"},
    
    # Class 11-12 Common
    {"name": "Bangla 1st Paper", "bengali_title": "সাহিত্য", "subject_code": "bangla_1st", "class_level": 11, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "ব্যাকরণ", "subject_code": "bangla_2nd", "class_level": 11, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English", "subject_code": "english_1st", "class_level": 11, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar", "subject_code": "english_2nd", "class_level": 11, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 11, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    {"name": "Physics", "bengali_title": "পদার্থবিজ্ঞান", "subject_code": "physics", "class_level": 11, "stream": "Science", "is_compulsory": False, "icon": "⚛️", "color": "bg-blue-300"},
    {"name": "Chemistry", "bengali_title": "রসায়ন", "subject_code": "chemistry", "class_level": 11, "stream": "Science", "is_compulsory": False, "icon": "🧪", "color": "bg-green-300"},
    {"name": "Biology", "bengali_title": "জীববিজ্ঞান", "subject_code": "biology", "class_level": 11, "stream": "Science", "is_compulsory": False, "icon": "🧬", "color": "bg-green-400"},
    {"name": "Higher Mathematics", "bengali_title": "উচ্চতর গণিত", "subject_code": "higher_math", "class_level": 11, "stream": "Science", "is_compulsory": False, "icon": "📐", "color": "bg-purple-300"},
    {"name": "Economics", "bengali_title": "অর্থনীতি", "subject_code": "economics", "class_level": 11, "stream": "Humanities", "is_compulsory": False, "icon": "📊", "color": "bg-yellow-400"},
    {"name": "Accounting", "bengali_title": "হিসাববিজ্ঞান", "subject_code": "accounting", "class_level": 11, "stream": "Business", "is_compulsory": False, "icon": "💰", "color": "bg-yellow-300"},
    {"name": "Finance & Banking", "bengali_title": "ফিন্যান্স ও ব্যাংকিং", "subject_code": "finance", "class_level": 11, "stream": "Business", "is_compulsory": False, "icon": "🏦", "color": "bg-green-600"},
    
    # Class 12 (Same as Class 11)
    {"name": "Bangla 1st Paper", "bengali_title": "সাহিত্য", "subject_code": "bangla_1st", "class_level": 12, "is_compulsory": True, "icon": "📖", "color": "bg-green-100"},
    {"name": "Bangla 2nd Paper", "bengali_title": "ব্যাকরণ", "subject_code": "bangla_2nd", "class_level": 12, "is_compulsory": True, "icon": "✍️", "color": "bg-green-200"},
    {"name": "English 1st Paper", "bengali_title": "English", "subject_code": "english_1st", "class_level": 12, "is_compulsory": True, "icon": "🇬🇧", "color": "bg-blue-100"},
    {"name": "English 2nd Paper", "bengali_title": "English Grammar", "subject_code": "english_2nd", "class_level": 12, "is_compulsory": True, "icon": "📝", "color": "bg-blue-200"},
    {"name": "ICT", "bengali_title": "তথ্য ও যোগাযোগ প্রযুক্তি", "subject_code": "ict", "class_level": 12, "is_compulsory": True, "icon": "💻", "color": "bg-indigo-100"},
    {"name": "Physics", "bengali_title": "পদার্থবিজ্ঞান", "subject_code": "physics", "class_level": 12, "stream": "Science", "is_compulsory": False, "icon": "⚛️", "color": "bg-blue-300"},
    {"name": "Chemistry", "bengali_title": "রসায়ন", "subject_code": "chemistry", "class_level": 12, "stream": "Science", "is_compulsory": False, "icon": "🧪", "color": "bg-green-300"},
    {"name": "Biology", "bengali_title": "জীববিজ্ঞান", "subject_code": "biology", "class_level": 12, "stream": "Science", "is_compulsory": False, "icon": "🧬", "color": "bg-green-400"},
    {"name": "Higher Mathematics", "bengali_title": "উচ্চতর গণিত", "subject_code": "higher_math", "class_level": 12, "stream": "Science", "is_compulsory": False, "icon": "📐", "color": "bg-purple-300"},
    {"name": "Economics", "bengali_title": "অর্থনীতি", "subject_code": "economics", "class_level": 12, "stream": "Humanities", "is_compulsory": False, "icon": "📊", "color": "bg-yellow-400"},
    {"name": "Accounting", "bengali_title": "হিসাববিজ্ঞান", "subject_code": "accounting", "class_level": 12, "stream": "Business", "is_compulsory": False, "icon": "💰", "color": "bg-yellow-300"},
    {"name": "Finance & Banking", "bengali_title": "ফিন্যান্স ও ব্যাংকিং", "subject_code": "finance", "class_level": 12, "stream": "Business", "is_compulsory": False, "icon": "🏦", "color": "bg-green-600"},
]

# Create subjects
created_count = 0
for subject_data in subjects_data:
    Subject.objects.create(**subject_data)
    created_count += 1

print(f"\n✅ Created {created_count} subjects successfully!")

# Display summary
print("\n📊 Subject Summary by Class:")
for class_level in range(6, 13):
    count = Subject.objects.filter(class_level=class_level).count()
    print(f"   Class {class_level}: {count} subjects")

print("\n🎉 Subject population complete!")
print("\n💡 Now students will see subjects based on their class level")
