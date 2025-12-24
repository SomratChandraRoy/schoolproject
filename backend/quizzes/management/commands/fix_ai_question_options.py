"""
Management command to fix AI-generated MCQ questions with missing options
"""
from django.core.management.base import BaseCommand
from quizzes.models import AIGeneratedQuestion


class Command(BaseCommand):
    help = 'Fix AI-generated MCQ questions that have empty or invalid options'

    def handle(self, *args, **options):
        self.stdout.write('Checking AI-generated questions...')
        
        # Find MCQ questions with empty or invalid options
        mcq_questions = AIGeneratedQuestion.objects.filter(question_type='mcq')
        
        total_count = mcq_questions.count()
        invalid_count = 0
        deleted_count = 0
        
        for question in mcq_questions:
            # Check if options is empty, None, or not a dict
            if not question.options or not isinstance(question.options, dict) or len(question.options) < 2:
                invalid_count += 1
                
                if question.is_answered:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  Question ID {question.id}: Invalid options but already answered - keeping'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f'  Question ID {question.id}: Invalid options - DELETING'
                        )
                    )
                    question.delete()
                    deleted_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary:'
                f'\n  Total MCQ questions: {total_count}'
                f'\n  Invalid questions found: {invalid_count}'
                f'\n  Questions deleted: {deleted_count}'
                f'\n  Questions kept (already answered): {invalid_count - deleted_count}'
            )
        )
