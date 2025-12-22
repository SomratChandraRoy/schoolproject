from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from quizzes.models import Quiz
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with sample questions for all classes'

    def handle(self, *args, **options):
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            admin = User.objects.filter(is_staff=True).first()
        if not admin:
            admin = User.objects.first()
        
        if not admin:
            self.stdout.write(self.style.ERROR('No users found. Create a user first.'))
            return

        questions_data = []
        
        # Mathematics Questions
        for cls in range(6, 13):
            questions_data.extend([
                {
                    'subject': 'math',
                    'class_target': cls,
                    'difficulty': 'easy',
                    'question_text': f'What is {cls} + {cls}?',
                    'question_type': 'mcq',
                    'options': json.dumps({'A': str(cls*2), 'B': str(cls*3), 'C': str(cls+1), 'D': str(cls-1)}),
                    'correct_answer': 'A',
                    'explanation': f'{cls} + {cls} = {cls*2}'
                },
                {
                    'subject': 'math',
                    'class_target': cls,
                    'difficulty': 'medium',
                    'question_text': f'What is {cls} × {cls}?',
                    'question_type': 'mcq',
                    'options': json.dumps({'A': str(cls*cls), 'B': str(cls*2), 'C': str(cls+cls), 'D': str(cls*3)}),
                    'correct_answer': 'A',
                    'explanation': f'{cls} × {cls} = {cls*cls}'
                },
            ])
        
        # Science Questions (Physics)
        for cls in range(6, 13):
            questions_data.extend([
                {
                    'subject': 'physics',
                    'class_target': cls,
                    'difficulty': 'easy',
                    'question_text': 'What is the chemical symbol for water?',
                    'question_type': 'mcq',
                    'options': json.dumps({'A': 'H2O', 'B': 'CO2', 'C': 'O2', 'D': 'N2'}),
                    'correct_answer': 'A',
                    'explanation': 'Water is H2O - two hydrogen atoms and one oxygen atom'
                },
                {
                    'subject': 'physics',
                    'class_target': cls,
                    'difficulty': 'medium',
                    'question_text': 'What is the speed of light?',
                    'question_type': 'mcq',
                    'options': json.dumps({'A': '300,000 km/s', 'B': '150,000 km/s', 'C': '500,000 km/s', 'D': '100,000 km/s'}),
                    'correct_answer': 'A',
                    'explanation': 'Light travels at approximately 300,000 kilometers per second'
                },
            ])
        
        # English Questions
        for cls in range(6, 13):
            questions_data.extend([
                {
                    'subject': 'english',
                    'class_target': cls,
                    'difficulty': 'easy',
                    'question_text': 'What is the plural of "child"?',
                    'question_type': 'mcq',
                    'options': json.dumps({'A': 'children', 'B': 'childs', 'C': 'childes', 'D': 'child'}),
                    'correct_answer': 'A',
                    'explanation': 'The plural of child is children (irregular plural)'
                },
            ])
        
        # Bangla Questions
        for cls in range(6, 13):
            questions_data.extend([
                {
                    'subject': 'bangla',
                    'class_target': cls,
                    'difficulty': 'easy',
                    'question_text': 'বাংলা বর্ণমালায় কতটি স্বরবর্ণ আছে?',
                    'question_type': 'mcq',
                    'options': json.dumps({'A': '১১টি', 'B': '১০টি', 'C': '১২টি', 'D': '৯টি'}),
                    'correct_answer': 'A',
                    'explanation': 'বাংলা বর্ণমালায় ১১টি স্বরবর্ণ আছে'
                },
            ])

        created_count = 0
        for q_data in questions_data:
            quiz, created = Quiz.objects.get_or_create(
                subject=q_data['subject'].lower(),
                class_target=q_data['class_target'],
                question_text=q_data['question_text'],
                defaults={
                    'difficulty': q_data['difficulty'],
                    'question_type': q_data['question_type'],
                    'options': q_data['options'],
                    'correct_answer': q_data['correct_answer'],
                    'explanation': q_data['explanation']
                }
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} new questions'))
