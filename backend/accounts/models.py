from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    CLASS_LEVEL_CHOICES = [
        (6, 'Class 6'),
        (7, 'Class 7'),
        (8, 'Class 8'),
        (9, 'Class 9'),
        (10, 'Class 10'),
        (11, 'Class 11'),
        (12, 'Class 12'),
    ]
    
    class_level = models.IntegerField(choices=CLASS_LEVEL_CHOICES, null=True, blank=True)
    fav_subjects = models.JSONField(default=list, blank=True)
    disliked_subjects = models.JSONField(default=list, blank=True)
    total_points = models.IntegerField(default=0)
    is_teacher = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.username} - Class {self.class_level}"