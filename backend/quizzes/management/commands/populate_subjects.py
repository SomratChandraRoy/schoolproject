from django.core.management.base import BaseCommand
from quizzes.models import Subject


class Command(BaseCommand):
    help = 'Populate subjects based on Bangladesh curriculum (Class 6-12)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Populating subjects...')

        # Clear existing subjects
        Subject.objects.all().delete()

        subjects_data = []

        common_6_10 = [
            {'name': 'Bengali', 'bengali_title': 'বাংলা', 'subject_code': 'bangla', 'icon': '📘', 'color': 'bg-yellow-100'},
            {'name': 'English', 'bengali_title': 'ইংরেজি', 'subject_code': 'english', 'icon': '🔤', 'color': 'bg-red-100'},
            {'name': 'Mathematics', 'bengali_title': 'গণিত', 'subject_code': 'math', 'icon': '📐', 'color': 'bg-blue-100'},
            {'name': 'Science', 'bengali_title': 'বিজ্ঞান', 'subject_code': 'science', 'icon': '🔬', 'color': 'bg-green-100'},
            {
                'name': 'History and Social Science',
                'bengali_title': 'ইতিহাস ও সামাজিক বিজ্ঞান',
                'subject_code': 'history_social_science',
                'icon': '🌍',
                'color': 'bg-amber-100'
            },
            {
                'name': 'Digital Technology',
                'bengali_title': 'ডিজিটাল প্রযুক্তি',
                'subject_code': 'digital_technology',
                'icon': '💻',
                'color': 'bg-indigo-100'
            },
            {
                'name': 'Life and Livelihood',
                'bengali_title': 'জীবন ও জীবিকা',
                'subject_code': 'life_livelihood',
                'icon': '🌱',
                'color': 'bg-lime-100'
            },
            {
                'name': 'Health and Wellbeing',
                'bengali_title': 'স্বাস্থ্য সুরক্ষা',
                'subject_code': 'health_wellbeing',
                'icon': '🩺',
                'color': 'bg-rose-100'
            },
            {
                'name': 'Religious Education',
                'bengali_title': 'ধর্ম শিক্ষা',
                'subject_code': 'religious_education',
                'icon': '🕌',
                'color': 'bg-teal-100'
            },
            {
                'name': 'Art and Culture',
                'bengali_title': 'শিল্প ও সংস্কৃতি',
                'subject_code': 'art_culture',
                'icon': '🎨',
                'color': 'bg-purple-100'
            },
        ]

        for cls in [6, 7, 8, 9, 10]:
            for subj in common_6_10:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': True, 'stream': None})

        common_11_12 = [
            {'name': 'Bengali', 'bengali_title': 'বাংলা', 'subject_code': 'bangla', 'icon': '📘', 'color': 'bg-yellow-100'},
            {'name': 'English', 'bengali_title': 'ইংরেজি', 'subject_code': 'english', 'icon': '🔤', 'color': 'bg-red-100'},
            {
                'name': 'Information and Communication Technology (ICT)',
                'bengali_title': 'তথ্য ও যোগাযোগ প্রযুক্তি',
                'subject_code': 'ict',
                'icon': '💻',
                'color': 'bg-indigo-100'
            },
        ]

        science_11_12 = [
            {'name': 'Physics', 'bengali_title': 'পদার্থবিজ্ঞান', 'subject_code': 'physics', 'stream': 'Science', 'icon': '⚛️', 'color': 'bg-sky-100'},
            {'name': 'Chemistry', 'bengali_title': 'রসায়ন', 'subject_code': 'chemistry', 'stream': 'Science', 'icon': '🧪', 'color': 'bg-green-100'},
            {'name': 'Higher Mathematics', 'bengali_title': 'উচ্চতর গণিত', 'subject_code': 'higher_math', 'stream': 'Science', 'icon': '📊', 'color': 'bg-blue-100'},
            {'name': 'Biology', 'bengali_title': 'জীববিজ্ঞান', 'subject_code': 'biology', 'stream': 'Science', 'icon': '🧬', 'color': 'bg-emerald-100'},
        ]

        humanities_11_12 = [
            {
                'name': 'Civics and Good Governance',
                'bengali_title': 'পৌরনীতি ও সুশাসন',
                'subject_code': 'civics_governance',
                'stream': 'Humanities',
                'icon': '⚖️',
                'color': 'bg-slate-100'
            },
            {'name': 'Economics', 'bengali_title': 'অর্থনীতি', 'subject_code': 'economics', 'stream': 'Humanities', 'icon': '💹', 'color': 'bg-violet-100'},
            {'name': 'History', 'bengali_title': 'ইতিহাস', 'subject_code': 'history', 'stream': 'Humanities', 'icon': '📜', 'color': 'bg-amber-100'},
            {
                'name': 'Islamic History and Culture',
                'bengali_title': 'ইসলামের ইতিহাস ও সংস্কৃতি',
                'subject_code': 'islamic_history_culture',
                'stream': 'Humanities',
                'icon': '🕌',
                'color': 'bg-teal-100'
            },
            {'name': 'Sociology', 'bengali_title': 'সমাজবিজ্ঞান', 'subject_code': 'sociology', 'stream': 'Humanities', 'icon': '👥', 'color': 'bg-cyan-100'},
            {'name': 'Social Work', 'bengali_title': 'সমাজকর্ম', 'subject_code': 'social_work', 'stream': 'Humanities', 'icon': '🤝', 'color': 'bg-lime-100'},
            {'name': 'Logic', 'bengali_title': 'যুক্তিবিদ্যা', 'subject_code': 'logic', 'stream': 'Humanities', 'icon': '🧠', 'color': 'bg-fuchsia-100'},
            {'name': 'Geography', 'bengali_title': 'ভূগোল', 'subject_code': 'geography', 'stream': 'Humanities', 'icon': '🗺️', 'color': 'bg-emerald-100'},
            {
                'name': 'Home Science',
                'bengali_title': 'গার্হস্থ্য বিজ্ঞান',
                'subject_code': 'home_science',
                'stream': 'Humanities',
                'icon': '🏠',
                'color': 'bg-orange-100'
            },
        ]

        business_11_12 = [
            {'name': 'Accounting', 'bengali_title': 'হিসাববিজ্ঞান', 'subject_code': 'accounting', 'stream': 'Business', 'icon': '💰', 'color': 'bg-yellow-100'},
            {
                'name': 'Business Organization and Management',
                'bengali_title': 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা',
                'subject_code': 'business_organization_management',
                'stream': 'Business',
                'icon': '🏢',
                'color': 'bg-indigo-100'
            },
            {
                'name': 'Finance, Banking and Insurance',
                'bengali_title': 'ফিন্যান্স, ব্যাংকিং ও বিমা',
                'subject_code': 'finance_banking_insurance',
                'stream': 'Business',
                'icon': '🏦',
                'color': 'bg-cyan-100'
            },
            {
                'name': 'Production Management and Marketing',
                'bengali_title': 'উৎপাদন ব্যবস্থাপনা ও বিপণন',
                'subject_code': 'production_marketing',
                'stream': 'Business',
                'icon': '📈',
                'color': 'bg-rose-100'
            },
        ]

        for cls in [11, 12]:
            for subj in common_11_12:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': True, 'stream': None})
            for subj in science_11_12:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
            for subj in humanities_11_12:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})
            for subj in business_11_12:
                subjects_data.append({**subj, 'class_level': cls, 'is_compulsory': False})

        created_count = 0
        for subj_data in subjects_data:
            Subject.objects.create(**subj_data)
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} subjects'))

        # Print summary by class
        for cls in range(6, 13):
            count = Subject.objects.filter(class_level=cls).count()
            self.stdout.write(f'Class {cls}: {count} subjects')
