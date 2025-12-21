from django.db import models
from accounts.models import User


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
    pdf_file = models.FileField(upload_to='books/')
    cover_image = models.ImageField(upload_to='book_covers/', blank=True, null=True)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - Class {self.class_level}"


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
    chapter_description = models.TextField(blank=True)
    page_range = models.CharField(max_length=50, blank=True)  # e.g., "10-25"
    estimated_hours = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('class_level', 'subject', 'chapter_title')
        ordering = ['class_level', 'subject', 'id']
    
    def __str__(self):
        return f"Class {self.class_level} - {self.get_subject_display()} - {self.chapter_title}"