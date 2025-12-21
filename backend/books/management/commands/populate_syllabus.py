import random
from django.core.management.base import BaseCommand
from books.models import Syllabus

class Command(BaseCommand):
    help = 'Populate the database with sample syllabus data'

    def handle(self, *args, **options):
        # Sample syllabus data
        sample_syllabus = [
            # Class 9 Mathematics
            {
                'class_level': 9,
                'subject': 'math',
                'chapter_title': 'Real Numbers',
                'chapter_description': 'Understanding real numbers, rational and irrational numbers, and their properties.',
                'page_range': '1-15',
                'estimated_hours': 2.5
            },
            {
                'class_level': 9,
                'subject': 'math',
                'chapter_title': 'Polynomials',
                'chapter_description': 'Introduction to polynomials, their types, and operations on polynomials.',
                'page_range': '16-35',
                'estimated_hours': 3.0
            },
            {
                'class_level': 9,
                'subject': 'math',
                'chapter_title': 'Coordinate Geometry',
                'chapter_description': 'Cartesian system, plotting points, and distance formula.',
                'page_range': '36-50',
                'estimated_hours': 2.0
            },
            # Class 9 Science (Physics)
            {
                'class_level': 9,
                'subject': 'physics',
                'chapter_title': 'Motion',
                'chapter_description': 'Understanding motion, distance, displacement, speed, velocity, and acceleration.',
                'page_range': '51-70',
                'estimated_hours': 3.5
            },
            {
                'class_level': 9,
                'subject': 'physics',
                'chapter_title': 'Force and Laws of Motion',
                'chapter_description': 'Newton\'s laws of motion and their applications.',
                'page_range': '71-90',
                'estimated_hours': 4.0
            },
            # Class 9 Science (Chemistry)
            {
                'class_level': 9,
                'subject': 'chemistry',
                'chapter_title': 'Matter in Our Surroundings',
                'chapter_description': 'States of matter and their properties.',
                'page_range': '91-105',
                'estimated_hours': 2.0
            },
            {
                'class_level': 9,
                'subject': 'chemistry',
                'chapter_title': 'Is Matter Around Us Pure',
                'chapter_description': 'Types of mixtures and methods of separation.',
                'page_range': '106-125',
                'estimated_hours': 3.0
            },
            # Class 9 Science (Biology)
            {
                'class_level': 9,
                'subject': 'biology',
                'chapter_title': 'The Fundamental Unit of Life',
                'chapter_description': 'Cell structure and functions.',
                'page_range': '126-145',
                'estimated_hours': 3.5
            },
            {
                'class_level': 9,
                'subject': 'biology',
                'chapter_title': 'Tissues',
                'chapter_description': 'Plant and animal tissues.',
                'page_range': '146-165',
                'estimated_hours': 3.0
            },
            # Class 9 English
            {
                'class_level': 9,
                'subject': 'english',
                'chapter_title': 'The Fun They Had',
                'chapter_description': 'Science fiction story by Isaac Asimov.',
                'page_range': '1-10',
                'estimated_hours': 1.5
            },
            {
                'class_level': 9,
                'subject': 'english',
                'chapter_title': 'The Sound of Music',
                'chapter_description': 'Biography of Evelyn Glennie.',
                'page_range': '11-20',
                'estimated_hours': 1.5
            },
            # Class 9 Bangla
            {
                'class_level': 9,
                'subject': 'bangla',
                'chapter_title': 'ঈশ্বরচন্দ্র গুপ্ত: সাহিত্য-সম্রাট',
                'chapter_description': 'জীবন ও সাহিত্যিক অবদান।',
                'page_range': '1-15',
                'estimated_hours': 2.0
            },
            {
                'class_level': 9,
                'subject': 'bangla',
                'chapter_title': 'দেবেন্দ্রনাথ সেন: অগ্নিবীণা',
                'chapter_description': 'কবি দেবেন্দ্রনাথ সেনের জীবন ও রচনা।',
                'page_range': '16-30',
                'estimated_hours': 2.0
            },
        ]

        # Create syllabus entries
        created_count = 0
        for item in sample_syllabus:
            syllabus, created = Syllabus.objects.get_or_create(
                class_level=item['class_level'],
                subject=item['subject'],
                chapter_title=item['chapter_title'],
                defaults={
                    'chapter_description': item['chapter_description'],
                    'page_range': item['page_range'],
                    'estimated_hours': item['estimated_hours']
                }
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated syllabus with {created_count} new entries.'
            )
        )