"""
Management command to clean up duplicate quiz attempts
Keeps the most recent attempt for each user+quiz combination
"""
from django.core.management.base import BaseCommand
from django.db.models import Count
from quizzes.models import QuizAttempt


class Command(BaseCommand):
    help = 'Clean up duplicate quiz attempts (keep most recent)'

    def handle(self, *args, **options):
        self.stdout.write('Cleaning up duplicate quiz attempts...')
        
        # Find duplicates
        duplicates = QuizAttempt.objects.values('user', 'quiz').annotate(
            count=Count('id')
        ).filter(count__gt=1)
        
        total_duplicates = duplicates.count()
        self.stdout.write(f'Found {total_duplicates} user+quiz combinations with duplicates')
        
        deleted_count = 0
        
        for dup in duplicates:
            user_id = dup['user']
            quiz_id = dup['quiz']
            
            # Get all attempts for this user+quiz
            attempts = QuizAttempt.objects.filter(
                user_id=user_id,
                quiz_id=quiz_id
            ).order_by('-attempted_at')
            
            # Keep the most recent, delete the rest
            attempts_to_delete = attempts[1:]
            
            for attempt in attempts_to_delete:
                self.stdout.write(
                    f'  Deleting duplicate: User {user_id}, Quiz {quiz_id}, '
                    f'Attempted at {attempt.attempted_at}'
                )
                attempt.delete()
                deleted_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully deleted {deleted_count} duplicate attempts'
            )
        )
