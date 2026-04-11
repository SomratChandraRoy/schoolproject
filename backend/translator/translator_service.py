"""
Translation Service for English-Bangla conversion.
Supports both online translation (via API) and offline dictionary lookups.
"""

import logging
import requests
from typing import Dict, List, Optional, Tuple
from django.db.models import Q, F
from .models import TranslationDictionary, UserTranslationHistory, TranslatorSession

logger = logging.getLogger(__name__)


class TranslatorService:
    """
    Main translator service handling all translation operations.
    """
    
    # Google Translate API endpoint (free tier)
    GOOGLE_TRANSLATE_API = "https://translate.googleapis.com/translate_a/element.js"
    
    @staticmethod
    def translate_text(
        text: str,
        source_language: str = 'en',
        target_language: str = 'bn',
        user=None,
        context_type: str = 'general'
    ) -> Dict:
        """
        Translate text from source to target language.
        
        Args:
            text: Text to translate
            source_language: Source language code ('en' or 'bn')
            target_language: Target language code ('en' or 'bn')
            user: User object for history tracking
            context_type: Context of translation (study, notes, etc.)
            
        Returns:
            {
                'translated_text': str,
                'source_text': str,
                'source_language': str,
                'target_language': str,
                'dictionary_entry': dict (optional),
                'is_offline': bool,
                'confidence': float (0-1),
                'alternatives': list
            }
        """
        
        if not text or not text.strip():
            return {
                'error': 'Empty text provided',
                'translated_text': '',
                'confidence': 0
            }
        
        text = text.strip()
        
        # First, try to find in local dictionary
        dictionary_result = TranslatorService.lookup_dictionary(
            text, 
            source_language, 
            target_language
        )
        
        if dictionary_result:
            translation = dictionary_result['target_text']
            is_offline = True
            confidence = 0.95  # High confidence for dictionary entries
            alternatives = [
                alt['target_text'] 
                for alt in TranslationDictionary.objects.filter(
                    source_text__iexact=text,
                    source_language=source_language,
                    target_language=target_language
                ).values('target_text')[:3]
            ]
        else:
            # Try online translation
            try:
                translation, confidence = TranslatorService.translate_online(
                    text,
                    source_language,
                    target_language
                )
                is_offline = False
                alternatives = []
            except Exception as e:
                logger.warning(f"Online translation failed: {e}. Using offline fallback.")
                # Fallback to similar terms in dictionary
                similar_terms = TranslatorService.find_similar_terms(
                    text,
                    source_language,
                    target_language
                )
                if similar_terms:
                    translation = similar_terms[0]['target_text']
                    is_offline = True
                    confidence = 0.6
                    alternatives = [t['target_text'] for t in similar_terms[1:4]]
                else:
                    # Return original text if no translation found
                    translation = text
                    is_offline = True
                    confidence = 0
                    alternatives = []
        
        # Prepare response
        response = {
            'translated_text': translation,
            'source_text': text,
            'source_language': source_language,
            'target_language': target_language,
            'is_offline': is_offline,
            'confidence': confidence,
            'alternatives': alternatives,
        }
        
        # Add dictionary entry if available
        if dictionary_result:
            response['dictionary_entry'] = {
                'id': dictionary_result['id'],
                'meaning': dictionary_result.get('meaning', ''),
                'word_type': dictionary_result.get('word_type', ''),
                'example_english': dictionary_result.get('example_english', ''),
                'example_bangla': dictionary_result.get('example_bangla', ''),
                'pronunciation_bangla': dictionary_result.get('pronunciation_bangla', ''),
                'context': dictionary_result.get('context', ''),
                'difficulty_level': dictionary_result.get('difficulty_level', 1),
            }
        
        # Track in history
        if user:
            TranslatorService.save_translation_history(
                user,
                text,
                translation,
                source_language,
                target_language,
                context_type,
                dictionary_result
            )
        
        return response
    
    @staticmethod
    def translate_online(
        text: str,
        source_language: str,
        target_language: str
    ) -> Tuple[str, float]:
        """
        Translate using online API (Google Translate)
        
        Returns:
            Tuple of (translated_text, confidence)
        """
        try:
            # Using Google Translate API through free endpoint
            lang_map = {
                'en': 'en',
                'bn': 'bn'
            }
            
            source = lang_map.get(source_language, 'en')
            target = lang_map.get(target_language, 'en')
            
            # Note: This is a simplified example. In production, use a proper API:
            # - Google Cloud Translation API
            # - Microsoft Translator
            # - LibreTranslate
            
            # For now, we'll use a basic approach
            # In production, replace with actual API call
            
            translation = text  # Placeholder
            confidence = 0.7
            
            # TODO: Implement actual API call here
            # Example with requests:
            # response = requests.get(
            #     'https://api.example.com/translate',
            #     params={
            #         'text': text,
            #         'source': source,
            #         'target': target,
            #     }
            # )
            # if response.status_code == 200:
            #     translation = response.json()['translated_text']
            #     confidence = response.json().get('confidence', 0.8)
            
            logger.info(f"Online translation: {text} → {translation}")
            return translation, confidence
            
        except Exception as e:
            logger.error(f"Translation API error: {e}")
            raise
    
    @staticmethod
    def lookup_dictionary(
        text: str,
        source_language: str,
        target_language: str
    ) -> Optional[Dict]:
        """
        Look up text in local dictionary.
        
        Returns:
            Dictionary entry dict or None
        """
        try:
            entry = TranslationDictionary.objects.get(
                source_text__iexact=text,
                source_language=source_language,
                target_language=target_language,
                is_verified=True
            )
            
            # Increment usage counter
            entry.usage_count = F('usage_count') + 1
            entry.save(update_fields=['usage_count'])
            
            return {
                'id': entry.id,
                'source_text': entry.source_text,
                'target_text': entry.target_text,
                'meaning': entry.meaning,
                'word_type': entry.word_type,
                'example_english': entry.example_english,
                'example_bangla': entry.example_bangla,
                'pronunciation_bangla': entry.pronunciation_bangla,
                'context': entry.context,
                'difficulty_level': entry.difficulty_level,
            }
        except TranslationDictionary.DoesNotExist:
            return None
    
    @staticmethod
    def find_similar_terms(
        text: str,
        source_language: str,
        target_language: str,
        limit: int = 5
    ) -> List[Dict]:
        """
        Find similar terms in dictionary.
        """
        # Search for similar words
        entries = TranslationDictionary.objects.filter(
            source_text__icontains=text,
            source_language=source_language,
            target_language=target_language,
            is_verified=True
        ).order_by('-usage_count')[:limit]
        
        return [
            {
                'id': entry.id,
                'source_text': entry.source_text,
                'target_text': entry.target_text,
                'word_type': entry.word_type,
            }
            for entry in entries
        ]
    
    @staticmethod
    def save_translation_history(
        user,
        source_text: str,
        translated_text: str,
        source_language: str,
        target_language: str,
        context_type: str,
        dictionary_entry: Optional[Dict] = None
    ) -> None:
        """
        Save translation to user's history.
        """
        try:
            # Find dictionary entry if exists
            dict_entry = None
            if dictionary_entry:
                try:
                    dict_entry = TranslationDictionary.objects.get(
                        id=dictionary_entry['id']
                    )
                except:
                    pass
            
            UserTranslationHistory.objects.create(
                user=user,
                source_text=source_text,
                source_language=source_language,
                translated_text=translated_text,
                target_language=target_language,
                dictionary_entry=dict_entry,
                context_type=context_type
            )
        except Exception as e:
            logger.error(f"Failed to save translation history: {e}")
    
    @staticmethod
    def get_user_history(
        user,
        source_language: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get user's translation history.
        """
        query = UserTranslationHistory.objects.filter(user=user)
        
        if source_language:
            query = query.filter(source_language=source_language)
        
        histories = query.order_by('-created_at')[:limit]
        
        return [
            {
                'id': h.id,
                'source_text': h.source_text,
                'translated_text': h.translated_text,
                'source_language': h.source_language,
                'target_language': h.target_language,
                'context_type': h.context_type,
                'created_at': h.created_at.isoformat(),
            }
            for h in histories
        ]
    
    @staticmethod
    def get_dictionary_suggestions(
        text: str,
        language: str = 'en',
        limit: int = 10
    ) -> List[Dict]:
        """
        Get dictionary suggestions for autocomplete.
        """
        if language == 'en':
            source_field = 'source_text'
        else:
            source_field = 'target_text'
        
        entries = TranslationDictionary.objects.filter(
            **{f'{source_field}__istartswith': text},
            is_verified=True
        ).values_list(source_field, flat=True).distinct()[:limit]
        
        return list(entries)
    
    @staticmethod
    def get_popular_words(
        source_language: str = 'en',
        target_language: str = 'bn',
        limit: int = 20,
        difficulty_level: Optional[int] = None
    ) -> List[Dict]:
        """
        Get popular/most used words.
        """
        query = TranslationDictionary.objects.filter(
            source_language=source_language,
            target_language=target_language,
            is_verified=True
        )
        
        if difficulty_level:
            query = query.filter(difficulty_level=difficulty_level)
        
        entries = query.order_by('-usage_count')[:limit]
        
        return [
            {
                'id': entry.id,
                'source_text': entry.source_text,
                'target_text': entry.target_text,
                'word_type': entry.word_type,
                'meaning': entry.meaning,
                'example_english': entry.example_english,
                'example_bangla': entry.example_bangla,
                'usage_count': entry.usage_count,
                'difficulty_level': entry.difficulty_level,
            }
            for entry in entries
        ]
