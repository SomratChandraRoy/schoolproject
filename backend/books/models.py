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