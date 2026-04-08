from django.core.management.base import BaseCommand
from books.models import Book


class Command(BaseCommand):
    help = 'Populate the database with sample book data'

    def handle(self, *args, **options):
        sample_books = [
            {
                'title': 'Bangla Bhasha O Sahitya',
                'author': 'NCTB',
                'class_level': 6,
                'category': 'textbook',
                'language': 'bn',
                'description': 'Class 6 Bangla textbook with grammar, prose, and poetry.',
                'pdf_file': '',
            },
            {
                'title': 'Mathematics for Class 7',
                'author': 'NCTB',
                'class_level': 7,
                'category': 'textbook',
                'language': 'en',
                'description': 'Core mathematics concepts for Class 7 students.',
                'pdf_file': '',
            },
            {
                'title': 'English Reader',
                'author': 'NCTB',
                'class_level': 8,
                'category': 'story',
                'language': 'en',
                'description': 'Reading comprehension and short stories for Class 8.',
                'pdf_file': '',
            },
            {
                'title': 'General Science',
                'author': 'NCTB',
                'class_level': 9,
                'category': 'textbook',
                'language': 'en',
                'description': 'Science fundamentals covering physics, chemistry, and biology.',
                'pdf_file': '',
            },
            {
                'title': 'Bangladesh and Global Studies',
                'author': 'NCTB',
                'class_level': 10,
                'category': 'textbook',
                'language': 'bn',
                'description': 'Civics, history, and social studies for Class 10.',
                'pdf_file': '',
            },
            {
                'title': 'Database Management Systems',
                'author': 'MedhaBangla Team',
                'class_level': 11,
                'category': 'textbook',
                'language': 'en',
                'description': 'Introduction to databases, tables, keys, and SQL concepts.',
                'pdf_file': 'books/DBMS_5.pdf',
            },
            {
                'title': 'Physics Concepts',
                'author': 'NCTB',
                'class_level': 12,
                'category': 'textbook',
                'language': 'en',
                'description': 'Higher secondary physics concepts and problem solving.',
                'pdf_file': '',
            },
        ]

        created_count = 0
        for item in sample_books:
            book, created = Book.objects.get_or_create(
                title=item['title'],
                class_level=item['class_level'],
                category=item['category'],
                language=item['language'],
                defaults={
                    'author': item['author'],
                    'description': item['description'],
                    'pdf_file': item['pdf_file'],
                }
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated books with {created_count} new entries.'
            )
        )
