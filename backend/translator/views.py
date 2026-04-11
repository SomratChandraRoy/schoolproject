"""
Django REST API views for translator functionality.
"""

import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import TranslationDictionary, UserTranslationHistory, TranslatorSession
from .translator_service import TranslatorService
from .serializers import (
    TranslationDictionarySerializer,
    UserTranslationHistorySerializer,
)

logger = logging.getLogger(__name__)


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def translate_text(request):
    """
    POST /api/translator/translate/
    
    Translate text from one language to another.
    
    Request body:
    {
        "text": "Hello",
        "source_language": "en",
        "target_language": "bn",
        "context_type": "general"  # optional
    }
    """
    try:
        text = request.data.get('text', '').strip()
        source_language = request.data.get('source_language', 'en')
        target_language = request.data.get('target_language', 'bn')
        context_type = request.data.get('context_type', 'general')
        
        if not text:
            return Response(
                {'error': 'Text field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if source_language not in ['en', 'bn']:
            return Response(
                {'error': 'Invalid source language'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if target_language not in ['en', 'bn']:
            return Response(
                {'error': 'Invalid target language'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Perform translation
        result = TranslatorService.translate_text(
            text=text,
            source_language=source_language,
            target_language=target_language,
            user=request.user,
            context_type=context_type
        )
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dictionary_lookup(request):
    """
    GET /api/translator/dictionary-lookup/?text=hello&language=en
    
    Look up a word in the dictionary.
    """
    try:
        text = request.query_params.get('text', '').strip()
        language = request.query_params.get('language', 'en')
        target_language = request.query_params.get('target_language', 'bn')
        
        if not text:
            return Response(
                {'error': 'Text query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = TranslatorService.lookup_dictionary(
            text=text,
            source_language=language,
            target_language=target_language
        )
        
        if result:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Return similar terms if exact match not found
            similar = TranslatorService.find_similar_terms(text, language, target_language)
            return Response({
                'message': 'Exact match not found. Here are similar terms:',
                'similar_terms': similar
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dictionary lookup error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dictionary_suggestions(request):
    """
    GET /api/translator/suggestions/?text=hel&language=en
    
    Get autocomplete suggestions for dictionary.
    """
    try:
        text = request.query_params.get('text', '').strip()
        language = request.query_params.get('language', 'en')
        limit = int(request.query_params.get('limit', 10))
        
        if not text or len(text) < 2:
            return Response(
                {'suggestions': []},
                status=status.HTTP_200_OK
            )
        
        suggestions = TranslatorService.get_dictionary_suggestions(
            text=text,
            language=language,
            limit=limit
        )
        
        return Response(
            {'suggestions': suggestions},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def translation_history(request):
    """
    GET /api/translator/history/?source_language=en&page=1
    
    Get user's translation history.
    """
    try:
        source_language = request.query_params.get('source_language')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        limit = (page - 1) * page_size + page_size
        
        history = TranslatorService.get_user_history(
            user=request.user,
            source_language=source_language,
            limit=limit
        )
        
        # Simple pagination
        history = history[(page-1)*page_size:page*page_size]
        
        return Response(
            {
                'count': len(history),
                'page': page,
                'page_size': page_size,
                'results': history
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"History retrieval error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def popular_words(request):
    """
    GET /api/translator/popular-words/?source_language=en&target_language=bn&difficulty=1
    
    Get popular/most used words.
    """
    try:
        source_language = request.query_params.get('source_language', 'en')
        target_language = request.query_params.get('target_language', 'bn')
        difficulty = request.query_params.get('difficulty')
        limit = int(request.query_params.get('limit', 20))
        
        words = TranslatorService.get_popular_words(
            source_language=source_language,
            target_language=target_language,
            difficulty_level=int(difficulty) if difficulty else None,
            limit=limit
        )
        
        return Response(
            {
                'count': len(words),
                'popular_words': words
            },
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Popular words error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_translation_helpful(request):
    """
    POST /api/translator/mark-helpful/
    
    Mark a translation as helpful or not.
    
    Request body:
    {
        "translation_id": 123,
        "is_helpful": true,
        "notes": "This translation helped me understand better"
    }
    """
    try:
        translation_id = request.data.get('translation_id')
        is_helpful = request.data.get('is_helpful')
        notes = request.data.get('notes', '')
        
        if not translation_id:
            return Response(
                {'error': 'translation_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        history = get_object_or_404(
            UserTranslationHistory,
            id=translation_id,
            user=request.user
        )
        
        history.is_helpful = is_helpful
        if notes:
            history.user_notes = notes
        history.save()
        
        return Response(
            {'message': 'Feedback saved successfully'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Helpful marking error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def export_offline_dictionary(request):
    """
    POST /api/translator/export-dictionary/
    
    Export dictionary for offline use.
    
    Returns a compact JSON format suitable for frontend storage.
    """
    try:
        source_language = request.data.get('source_language', 'en')
        target_language = request.data.get('target_language', 'bn')
        difficulty_limit = request.data.get('difficulty_limit', 5)  # 1-5
        
        # Get popular words for offline package
        words = TranslatorService.get_popular_words(
            source_language=source_language,
            target_language=target_language,
            limit=2000  # Export top 2000 words
        )
        
        # Compact format for offline storage
        offline_data = {
            'version': 1,
            'source_language': source_language,
            'target_language': target_language,
            'exported_at': __import__('datetime').datetime.now().isoformat(),
            'total_entries': len(words),
            'dictionary': [
                {
                    'id': w['id'],
                    's': w['source_text'],  # source_text
                    't': w['target_text'],  # target_text
                    'w': w['word_type'],  # word_type
                    'm': w['meaning'][:100] if w['meaning'] else '',  # meaning (truncated)
                    'e': w['example_english'][:100] if w['example_english'] else '',  # example
                }
                for w in words
            ]
        }
        
        return Response(offline_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dictionary export error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class TranslationDictionaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing dictionary entries.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    serializer_class = TranslationDictionarySerializer
    
    def get_queryset(self):
        queryset = TranslationDictionary.objects.filter(is_verified=True)
        
        # Filter by language pair
        source_language = self.request.query_params.get('source_language')
        target_language = self.request.query_params.get('target_language')
        word_type = self.request.query_params.get('word_type')
        difficulty = self.request.query_params.get('difficulty')
        search = self.request.query_params.get('search')
        
        if source_language:
            queryset = queryset.filter(source_language=source_language)
        
        if target_language:
            queryset = queryset.filter(target_language=target_language)
        
        if word_type:
            queryset = queryset.filter(word_type=word_type)
        
        if difficulty:
            queryset = queryset.filter(difficulty_level=int(difficulty))
        
        if search:
            queryset = queryset.filter(
                Q(source_text__icontains=search) |
                Q(target_text__icontains=search) |
                Q(meaning__icontains=search)
            )
        
        return queryset.order_by('-usage_count')
