import logging
import mimetypes
import os

from django.conf import settings
from django.db import models
from accounts.models import User


logger = logging.getLogger(__name__)


class Book(models.Model):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('bn', 'Bangla'),
    ]
    
    CATEGORY_CHOICES = [
        ('textbook', 'Textbook'),
        ('story', 'Story'),
        ('poem', 'Poem'),
        ('poetry', 'Poetry'),
    ]
    
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    class_level = models.IntegerField(choices=[(i, f'Class {i}') for i in range(6, 13)])
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    pdf_file = models.FileField(upload_to='books/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    drive_view_link = models.URLField(max_length=500, blank=True, null=True)
    drive_download_link = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - Class {self.class_level}"

    @property
    def pdf_source_url(self):
        if self.drive_download_link:
            return self.drive_download_link
        if self.pdf_file:
            try:
                return self.pdf_file.url
            except ValueError:
                return ''
        return ''

    def _sync_pdf_to_google_drive(self, previous_drive_file_id=None):
        if not self.pdf_file:
            return

        try:
            from chat.google_drive import get_drive_service

            drive_service = get_drive_service()
            if not drive_service or not getattr(drive_service, 'service', None):
                logger.warning('Google Drive service not initialized for Book %s', self.pk)
                return

            upload_folder = (
                getattr(settings, 'GOOGLE_DRIVE_BOOKS_FOLDER_ID', '')
                or settings.GOOGLE_DRIVE_FOLDER_ID
                or None
            )

            self.pdf_file.open('rb')
            file_obj = getattr(self.pdf_file, 'file', self.pdf_file)
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)

            file_name = os.path.basename(self.pdf_file.name) or f'book-{self.pk}.pdf'
            mime_type = mimetypes.guess_type(file_name)[0] or 'application/pdf'

            drive_result = drive_service.upload_file(
                file_content=file_obj,
                file_name=file_name,
                mime_type=mime_type,
                folder_id=upload_folder,
            )

            drive_file_id = drive_result.get('id')
            if not drive_file_id:
                return

            drive_view_link = drive_result.get('view_link') or f'https://drive.google.com/file/d/{drive_file_id}/view'
            drive_download_link = drive_result.get('download_link') or f'https://drive.google.com/uc?export=download&id={drive_file_id}'

            Book.objects.filter(pk=self.pk).update(
                drive_file_id=drive_file_id,
                drive_view_link=drive_view_link,
                drive_download_link=drive_download_link,
            )

            self.drive_file_id = drive_file_id
            self.drive_view_link = drive_view_link
            self.drive_download_link = drive_download_link

            if previous_drive_file_id and previous_drive_file_id != drive_file_id:
                drive_service.delete_file(previous_drive_file_id)

        except Exception:
            logger.exception('Failed to sync book PDF to Google Drive for Book %s', self.pk)

    def save(self, *args, **kwargs):
        previous_pdf_name = ''
        previous_drive_file_id = None

        if self.pk:
            previous = Book.objects.filter(pk=self.pk).only('pdf_file', 'drive_file_id').first()
            if previous:
                previous_pdf_name = previous.pdf_file.name if previous.pdf_file else ''
                previous_drive_file_id = previous.drive_file_id

        current_pdf_name = self.pdf_file.name if self.pdf_file else ''
        has_pending_upload = bool(self.pdf_file and hasattr(self.pdf_file, '_committed') and not self.pdf_file._committed)
        pdf_changed = has_pending_upload or current_pdf_name != previous_pdf_name

        if not current_pdf_name:
            self.drive_file_id = None
            self.drive_view_link = None
            self.drive_download_link = None

        super().save(*args, **kwargs)

        if not getattr(settings, 'USE_GOOGLE_DRIVE', False):
            return

        if pdf_changed and current_pdf_name:
            self._sync_pdf_to_google_drive(previous_drive_file_id=previous_drive_file_id)
            return

        if pdf_changed and not current_pdf_name and previous_drive_file_id:
            try:
                from chat.google_drive import get_drive_service

                drive_service = get_drive_service()
                if drive_service and getattr(drive_service, 'service', None):
                    drive_service.delete_file(previous_drive_file_id)
            except Exception:
                logger.exception('Failed to delete stale Google Drive file for Book %s', self.pk)


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    page_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'book')
    
    def __str__(self):
        return f"{self.user.username} - {self.book.title} - Page {self.page_number}"


class Syllabus(models.Model):
    CLASS_LEVEL_CHOICES = [(i, f'Class {i}') for i in range(6, 13)]
    SUBJECT_CHOICES = [
        ('math', 'Mathematics'),
        ('physics', 'Physics'),
        ('chemistry', 'Chemistry'),
        ('biology', 'Biology'),
        ('english', 'English'),
        ('bangla', 'Bangla'),
        ('ict', 'ICT'),
        ('general_knowledge', 'General Knowledge'),
    ]
    
    class_level = models.IntegerField(choices=CLASS_LEVEL_CHOICES)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    chapter_title = models.CharField(max_length=200)
    chapter_number = models.IntegerField(default=1)
    chapter_description = models.TextField(blank=True)
    page_range = models.CharField(max_length=50, blank=True)  # e.g., "10-25"
    estimated_hours = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    
    # File uploads for syllabus content
    syllabus_pdf = models.FileField(upload_to='syllabus/pdfs/', blank=True, null=True)
    syllabus_image = models.ImageField(upload_to='syllabus/images/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('class_level', 'subject', 'chapter_title')
        ordering = ['class_level', 'subject', 'chapter_number']
    
    def __str__(self):
        return f"Class {self.class_level} - {self.get_subject_display()} - {self.chapter_title}"