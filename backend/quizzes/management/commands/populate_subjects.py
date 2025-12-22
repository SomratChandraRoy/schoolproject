from django.core.management.base import BaseCommand
from quizzes.models import Subject


class Command(BaseCommand):
    help = 'Populate subjects based on Bangladesh curriculum (Class 6-12)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating subjects...')
        
        # Clear existing subjects
        Subject.objects.all().delete()
        
        subjects_data = []
        
        # Class 6 subjects
        class_6_subjects = [
            {'name': 'Bangla 1st Paper', 'bengali_title': 'চারুপাঠ', 'subject_code': 'bangla_1st', 'class_level': 6, 'icon': '📖', 'color': 'bg-yellow-100'},
            {'name': 'Bangla 2nd Paper', 'bengali_title': 'বাংলা ব্যাকরণ ও নির্মিতি', 'subject_code': 'bangla_2nd', 'class_level': 6, 'icon': '✍️', 'color': 'bg-yellow-100'},
            {'name': 'English 1st Paper', 'bengali_title': 'English For Today', 'subject_code': 'english_1st', 'class_level': 6, 'icon': '🔤', 'color': 'bg-red-100'},
            {'name': 'English 2nd Paper', 'bengali_title': 'English Grammar & Composition', 'subject_code': 'english_2nd', 'class_level': 6, 'icon': '📝', 'color': 'bg-red-100'},
            {'name': 'Mathematics', 'bengali_title': 'গণিত', 'subject_code': 'math', 'class_level': 6, 'icon': '📐', 'color': 'bg-blue-100'},
            {'name': 'Science', 'bengali_title': 'বিজ্ঞান', 'subject_code': 'science', 'class_level': 6, 'icon': '🔬', 'color': 'bg-green-100'},
            {'name': 'Bangladesh & Global Studies', 'bengali_title': 'বাংলাদেশ ও বিশ্বপরিচয়', 'subject_code': 'bangladesh_global', 'class_level': 6, 'icon': '🌍', 'color': 'bg-teal-100'},
            {'name': 'ICT', 'bengali_title': 'তথ্য ও যোগাযোগ প্রযুক্তি', 'subject_code': 'ict', 'class_level': 6, 'icon': '💻', 'color': 'bg-indigo-100'},
        ]
        
        # Class 7 subjects (similar to Class 6)
        class_7_subjects = [
            {'name': 'Bangla 1st Paper', 'bengali_title': 'সপ্তবর্ণা', 'subject_code': 'bangla_1st', 'class_level': 7, 'icon': '📖', 'color': 'bg-yellow-100'},
            {'name': 'Bangla 2nd Paper', 'bengali_title': 'বাংলা ব্যাকরণ ও নির্মিতি', 'subject_code': 'bangla_2nd', 'class_level': 7, 'icon': '✍️', 'color': 'bg-yellow-100'},
            {'name': 'English 1st Paper', 'bengali_title': 'English For Today', 'subject_code': 'english_1st', 'class_level': 7, 'icon': '🔤', 'color': 'bg-red-100'},
            {'name': 'English 2nd Paper', 'bengali_title': 'English Grammar & Composition', 'subject_code': 'english_2nd', 'class_level': 7, 'icon': '📝', 'color': 'bg-red-100'},
            {'name': 'Mathematics', 'bengali_title': 'গণিত', 'subject_code': 'math', 'class_level': 7, 'icon': '📐', 'color': 'bg-blue-100'},
            {'name': 'Science', 'bengali_title': 'বিজ্ঞান', 'subject_code': 'science', 'class_level': 7, 'icon': '🔬', 'color': 'bg-green-100'},
            {'name': 'Bangladesh & Global Studies', 'bengali_title': 'বাংলাদেশ ও বিশ্বপরিচয়', 'subject_code': 'bangladesh_global', 'class_level': 7, 'icon': '🌍', 'color': 'bg-teal-100'},
            {'name': 'ICT', 'bengali_title': 'তথ্য ও যোগাযোগ প্রযুক্তি', 'subject_code': 'ict', 'class_level': 7, 'icon': '💻', 'color': 'bg-indigo-100'},
        ]
        
        # Class 8 subjects
        class_8_subjects = [
            {'name': 'Bangla 1st Paper', 'bengali_title': 'সাহিত্য কণিকা', 'subject_code': 'bangla_1st', 'class_level': 8, 'icon': '📖', 'color': 'bg-yellow-100'},
            {'name': 'Bangla 2nd Paper', 'bengali_title': 'বাংলা ব্যাকরণ ও নির্মিতি', 'subject_code': 'bangla_2nd', 'class_level': 8, 'icon': '✍️', 'color': 'bg-yellow-100'},
            {'name': 'English 1st Paper', 'bengali_title': 'English For Today', 'subject_code': 'english_1st', 'class_level': 8, 'icon': '🔤', 'color': 'bg-red-100'},
            {'name': 'English 2nd Paper', 'bengali_title': 'English Grammar & Composition', 'subject_code': 'english_2nd', 'class_level': 8, 'icon': '📝', 'color': 'bg-red-100'},
            {'name': 'Mathematics', 'bengali_title': 'গণিত', 'subject_code': 'math', 'class_level': 8, 'icon': '📐', 'color': 'bg-blue-100'},
            {'name': 'Science', 'bengali_title': 'বিজ্ঞান', 'subject_code': 'science', 'class_level': 8, 'icon': '🔬', 'color': 'bg-green-100'},
            {'name': 'Bangladesh & Global Studies', 'bengali_title': 'বাংলাদেশ ও বিশ্বপরিচয়', 'subject_code': 'bangladesh_global', 'class_level': 8, 'icon': '🌍', 'color': 'bg-teal-100'},
            {'name': 'ICT', 'bengali_title': 'তথ্য ও যোগাযোগ প্রযুক্তি', 'subject_code': 'ict', 'class_level': 8, 'icon': '💻', 'color': 'bg-indigo-100'},
        ]
        
        # Class 9-10 Common subjects
        class_9_10_common = [
            {'name': 'Bangla 1st Paper', 'bengali_title': 'সাহিত্য', 'subject_code': 'bangla_1st', 'icon': '📖', 'color': 'bg-yellow-100'},
            {'name': 'Bangla 2nd Paper', 'bengali_title': 'ব্যাকরণ ও নির্মিতি', 'subject_code': 'bangla_2nd', 'icon': '✍️', 'color': 'bg-yellow-100'},
            {'name': 'English 1st Paper', 'bengali_title': 'English For Today', 'subject_code': 'english_1st', 'icon': '🔤', 'color': 'bg-red-100'},
            {'name': 'English 2nd Paper', 'bengali_title': 'English Grammar', 'subject_code': 'english_2nd', 'icon': '📝', 'color': 'bg-red-100'},
            {'name': 'ICT', 'bengali_title': 'তথ্য ও যোগাযোগ প্রযুক্তি', 'subject_code': 'ict', 'icon': '💻', 'color': 'bg-indigo-100'},
        ]
        
        # Class 9-10 Science stream
        class_9_10_science = [
            {'name': 'Physics', 'bengali_title': 'পদার্থবিজ্ঞান', 'subject_code': 'physics', 'stream': 'Science', 'icon': '⚛️', 'color': 'bg-purple-100'},
            {'name': 'Chemistry', 'bengali_title': 'রসায়ন', 'subject_code': 'chemistry', 'stream': 'Science', 'icon': '🧪', 'color': 'bg-green-100'},
            {'name': 'Biology', 'bengali_title': 'জীববিজ্ঞান', 'subject_code': 'biology', 'stream': 'Science', 'icon': '🧬', 'color': 'bg-teal-100'},
            {'name': 'Higher Mathematics', 'bengali_title': 'উচ্চতর গণিত', 'subject_code': 'higher_math', 'stream': 'Science', 'icon': '📊', 'color': 'bg-blue-100'},
        ]
        
        # Class 9-10 Humanities stream
        class_9_10_humanities = [
            {'name': 'History', 'bengali_title': 'ইতিহাস', 'subject_code': 'history', 'stream': 'Humanities', 'icon': '📜', 'color': 'bg-amber-100'},
            {'name': 'Geography', 'bengali_title': 'ভূগোল', 'subject_code': 'geography', 'stream': 'Humanities', 'icon': '🗺️', 'color': 'bg-emerald-100'},
            {'name': 'Civics', 'bengali_title': 'পৌরনীতি', 'subject_code': 'civics', 'stream': 'Humanities', 'icon': '⚖️', 'color': 'bg-slate-100'},
            {'name': 'General Science', 'bengali_title': 'সাধারণ বিজ্ঞান', 'subject_code': 'general_science', 'stream': 'Humanities', 'icon': '🔬', 'color': 'bg-green-100'},
        ]
        
        # Class 9-10 Business stream
        class_9_10_business = [
            {'name': 'Accounting', 'bengali_title': 'হিসাববিজ্ঞান', 'subject_code': 'accounting', 'stream': 'Business', 'icon': '💰', 'color': 'bg-lime-100'},
            {'name': 'Finance & Banking', 'bengali_title': 'ফিন্যান্স ও ব্যাংকিং', 'subject_code': 'finance', 'stream': 'Business', 'icon': '🏦', 'color': 'bg-cyan-100'},
            {'name': 'Business Entrepreneurship', 'bengali_title': 'ব্যবসায় উদ্যোগ', 'subject_code': 'business', 'stream': 'Business', 'icon': '📈', 'color': 'bg-orange-100'},
        ]
        
        # Add Class 9-10 subjects
        for cls in [9, 10]:
            for subj in class_9_10_common:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': True})
            for subj in class_9_10_science:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
            for subj in class_9_10_humanities:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
            for subj in class_9_10_business:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
        
        # Class 11-12 Common subjects
        class_11_12_common = [
            {'name': 'Bangla 1st Paper', 'bengali_title': 'সাহিত্য', 'subject_code': 'bangla_1st', 'icon': '📖', 'color': 'bg-yellow-100'},
            {'name': 'Bangla 2nd Paper', 'bengali_title': 'ব্যাকরণ ও নির্মিতি', 'subject_code': 'bangla_2nd', 'icon': '✍️', 'color': 'bg-yellow-100'},
            {'name': 'English 1st Paper', 'bengali_title': 'English', 'subject_code': 'english_1st', 'icon': '🔤', 'color': 'bg-red-100'},
            {'name': 'English 2nd Paper', 'bengali_title': 'English Grammar', 'subject_code': 'english_2nd', 'icon': '📝', 'color': 'bg-red-100'},
            {'name': 'ICT', 'bengali_title': 'তথ্য ও যোগাযোগ প্রযুক্তি', 'subject_code': 'ict', 'icon': '💻', 'color': 'bg-indigo-100'},
        ]
        
        # Class 11-12 Science stream
        class_11_12_science = [
            {'name': 'Physics', 'bengali_title': 'পদার্থবিজ্ঞান', 'subject_code': 'physics', 'stream': 'Science', 'icon': '⚛️', 'color': 'bg-purple-100'},
            {'name': 'Chemistry', 'bengali_title': 'রসায়ন', 'subject_code': 'chemistry', 'stream': 'Science', 'icon': '🧪', 'color': 'bg-green-100'},
            {'name': 'Biology', 'bengali_title': 'জীববিজ্ঞান', 'subject_code': 'biology', 'stream': 'Science', 'icon': '🧬', 'color': 'bg-teal-100'},
            {'name': 'Higher Mathematics', 'bengali_title': 'উচ্চতর গণিত', 'subject_code': 'higher_math', 'stream': 'Science', 'icon': '📊', 'color': 'bg-blue-100'},
        ]
        
        # Class 11-12 Humanities stream
        class_11_12_humanities = [
            {'name': 'Economics', 'bengali_title': 'অর্থনীতি', 'subject_code': 'economics', 'stream': 'Humanities', 'icon': '💹', 'color': 'bg-violet-100'},
            {'name': 'Civics & Good Governance', 'bengali_title': 'পৌরনীতি ও সুশাসন', 'subject_code': 'civics', 'stream': 'Humanities', 'icon': '⚖️', 'color': 'bg-slate-100'},
        ]
        
        # Class 11-12 Business stream
        class_11_12_business = [
            {'name': 'Accounting', 'bengali_title': 'হিসাববিজ্ঞান', 'subject_code': 'accounting', 'stream': 'Business', 'icon': '💰', 'color': 'bg-lime-100'},
            {'name': 'Finance, Banking & Insurance', 'bengali_title': 'ফিন্যান্স, ব্যাংকিং ও বীমা', 'subject_code': 'finance', 'stream': 'Business', 'icon': '🏦', 'color': 'bg-cyan-100'},
        ]
        
        # Add Class 11-12 subjects
        for cls in [11, 12]:
            for subj in class_11_12_common:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': True})
            for subj in class_11_12_science:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
            for subj in class_11_12_humanities:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
            for subj in class_11_12_business:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
        
        # Add all subjects to database
        subjects_data.extend(class_6_subjects)
        subjects_data.extend(class_7_subjects)
        subjects_data.extend(class_8_subjects)
        
        created_count = 0
        for subj_data in subjects_data:
            Subject.objects.create(**subj_data)
            created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} subjects'))
        
        # Print summary by class
        for cls in range(6, 13):
            count = Subject.objects.filter(class_level=cls).count()
            self.stdout.write(f'Class {cls}: {count} subjects')
