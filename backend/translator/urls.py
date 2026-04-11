"""
URL routing for translator API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    translate_text,
    dictionary_lookup,
    dictionary_suggestions,
    translation_history,
    popular_words,
    mark_translation_helpful,
    export_offline_dictionary,
    TranslationDictionaryViewSet,
)

router = DefaultRouter()
router.register(r'dictionary', TranslationDictionaryViewSet, basename='dictionary')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Translation endpoints
    path('translate/', translate_text, name='translate'),
    path('dictionary-lookup/', dictionary_lookup, name='dictionary-lookup'),
    path('suggestions/', dictionary_suggestions, name='suggestions'),
    path('history/', translation_history, name='history'),
    path('popular-words/', popular_words, name='popular-words'),
    path('mark-helpful/', mark_translation_helpful, name='mark-helpful'),
    path('export-dictionary/', export_offline_dictionary, name='export-dictionary'),
]
