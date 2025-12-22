"""
Management command to clean up duplicate users in the database
Usage: python manage.py cleanup_duplicate_users
"""

from django.core.management.base import BaseCommand
from django.db.models import Count
from accounts.models import User


class Command(BaseCommand):
    help = 'Clean up duplicate users with the same email address'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting duplicate user cleanup...'))
        
        # Find emails that have multiple users
        duplicate_emails = (
            User.objects.values('email')
            .annotate(email_count=Count('email'))
            .filter(email_count__gt=1)
        )
        
        if not duplicate_emails:
            self.stdout.write(self.style.SUCCESS('No duplicate users found!'))
            return
        
        self.stdout.write(self.style.WARNING(f'Found {len(duplicate_emails)} emails with duplicates'))
        
        total_deleted = 0
        
        for item in duplicate_emails:
            email = item['email']
            count = item['email_count']
            
            self.stdout.write(f'\nProcessing email: {email} ({count} users)')
            
            # Get all users with this email, ordered by date_joined (oldest first)
            users = User.objects.filter(email=email).order_by('date_joined')
            
            # Keep the first one (oldest)
            keep_user = users.first()
            self.stdout.write(self.style.SUCCESS(f'  Keeping user ID {keep_user.id} (joined: {keep_user.date_joined})'))
            
            # Delete the rest
            for user in users[1:]:
                self.stdout.write(self.style.WARNING(f'  Deleting user ID {user.id} (joined: {user.date_joined})'))
                user.delete()
                total_deleted += 1
        
        self.stdout.write(self.style.SUCCESS(f'\nCleanup complete! Deleted {total_deleted} duplicate users.'))
