"""
Django management command to clean up duplicate UserPerformance records
Usage: python manage.py cleanup_duplicates
"""
from django.core.management.base import BaseCommand
from django.db.models import Count
from quizzes.models import UserPerformance


class Command(BaseCommand):
    help = 'Clean up duplicate UserPerformance records'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("CLEANUP DUPLICATE USER PERFORMANCE RECORDS")
        self.stdout.write("=" * 60)
        
        # Find duplicates
        duplicates = UserPerformance.objects.values('user', 'subject').annotate(
            count=Count('id')
        ).filter(count__gt=1)
        
        total_duplicates = duplicates.count()
        
        if total_duplicates == 0:
            self.stdout.write(self.style.SUCCESS("\n✅ No duplicates found!"))
            return
        
        self.stdout.write(f"\nFound {total_duplicates} duplicate groups")
        
        cleaned_count = 0
        deleted_count = 0
        
        for dup in duplicates:
            user_id = dup['user']
            subject = dup['subject']
            count = dup['count']
            
            # Get all records for this user+subject
            records = UserPerformance.objects.filter(
                user_id=user_id,
                subject=subject
            ).order_by('-last_updated')
            
            # Keep the most recent one
            keep = records.first()
            
            # Delete the rest
            to_delete = records[1:]
            delete_ids = [r.id for r in to_delete]
            
            if delete_ids:
                UserPerformance.objects.filter(id__in=delete_ids).delete()
                deleted_count += len(delete_ids)
                cleaned_count += 1
                
                self.stdout.write(
                    f"✓ Cleaned user_id={user_id}, subject={subject}: "
                    f"kept ID {keep.id}, deleted {len(delete_ids)} duplicates"
                )
        
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("SUMMARY")
        self.stdout.write("=" * 60)
        self.stdout.write(f"Duplicate groups cleaned: {cleaned_count}")
        self.stdout.write(f"Total records deleted: {deleted_count}")
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Cleanup complete!"))
