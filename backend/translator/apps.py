"""
Translator app for English-Bangla translation with offline support
"""

from django.apps import AppConfig


class TranslatorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'translator'
    verbose_name = 'Translator - English-Bangla Dictionary'
