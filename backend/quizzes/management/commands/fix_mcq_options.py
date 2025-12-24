"""
Django management command to fix MCQ questions with invalid options
Usage: python manage.py fix_mcq_options
"""
from django.core.management.base import BaseCommand
from quizzes.models import Quiz


class Command(BaseCommand):
    help = 'Fix MCQ questions with invalid or missing options'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("FIX MCQ QUESTIONS")
        self.stdout.write("=" * 60)
        
        # Get all MCQ questions
        all_mcq = Quiz.objects.filter(question_type='mcq')
        total_mcq = all_mcq.count()
        
        self.stdout.write(f"\nTotal MCQ questions: {total_mcq}")
        
        if total_mcq == 0:
            self.stdout.write(self.style.WARNING("No MCQ questions found."))
            return
        
        # Find and fix invalid questions
        fixed_count = 0
        invalid_count = 0
        
        for question in all_mcq:
            is_invalid = False
            
            # Check if options is invalid
            if not isinstance(question.options, dict):
                is_invalid = True
            elif len(question.options) == 0:
                is_invalid = True
            elif len(question.options) < 2:
                is_invalid = True
            
            if is_invalid:
                invalid_count += 1
                self.stdout.write(f"\n❌ Invalid: ID {question.id} - {question.question_text[:60]}...")
                self.stdout.write(f"   Current options: {question.options}")
                
                # Fix by creating default options
                question.options = {
                    'A': question.correct_answer if question.correct_answer else 'Option A',
                    'B': 'Option B',
                    'C': 'Option C',
                    'D': 'Option D'
                }
                question.save()
                fixed_count += 1
                self.stdout.write(self.style.SUCCESS(f"   ✓ Fixed with default options"))
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("SUMMARY")
        self.stdout.write("=" * 60)
        self.stdout.write(f"Total MCQ questions: {total_mcq}")
        self.stdout.write(f"Invalid questions found: {invalid_count}")
        self.stdout.write(f"Questions fixed: {fixed_count}")
        
        if fixed_count > 0:
            self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully fixed {fixed_count} questions!"))
            self.stdout.write(self.style.WARNING("⚠️  Note: Fixed questions use default options. Please review manually."))
        else:
            self.stdout.write(self.style.SUCCESS("\n✅ All MCQ questions are valid!"))
