"""
AI-powered PDF Chat Views
Allows users to chat with AI about PDF content
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.core.cache import cache
import requests
from .api_key_manager import get_key_manager
import google.generativeai as genai
import PyPDF2
from io import BytesIO
import hashlib


class AnalyzePDFView(APIView):
    """
    Analyze PDF content and prepare for Q&A
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        pdf_url = request.data.get('pdf_url')
        book_id = request.data.get('book_id')
        file_name = request.data.get('file_name', 'document.pdf')
        
        if not pdf_url:
            return Response(
                {'error': 'PDF URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate cache key for this PDF
            pdf_hash = hashlib.md5(pdf_url.encode()).hexdigest()
            cache_key = f'pdf_content_{pdf_hash}'
            
            # Check if already analyzed
            cached_content = cache.get(cache_key)
            if cached_content:
                return Response({
                    'status': 'success',
                    'message': 'PDF already analyzed',
                    'cached': True
                })
            
            # Download PDF
            response = requests.get(pdf_url, timeout=30)
            if response.status_code != 200:
                return Response(
                    {'error': 'Failed to download PDF'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract text from PDF
            pdf_file = BytesIO(response.content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Extract text from all pages
            full_text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                full_text += f"\n--- Page {page_num + 1} ---\n"
                full_text += page.extract_text()
            
            # Limit text size (Gemini has token limits)
            max_chars = 100000  # ~25k tokens
            if len(full_text) > max_chars:
                full_text = full_text[:max_chars] + "\n\n[Content truncated due to length...]"
            
            # Cache the PDF content for 1 hour
            cache.set(cache_key, full_text, 3600)
            
            # Also cache metadata
            metadata_key = f'pdf_metadata_{pdf_hash}'
            cache.set(metadata_key, {
                'file_name': file_name,
                'book_id': book_id,
                'pages': len(pdf_reader.pages),
                'char_count': len(full_text)
            }, 3600)
            
            return Response({
                'status': 'success',
                'message': 'PDF analyzed successfully',
                'pages': len(pdf_reader.pages),
                'cached': False
            })
            
        except Exception as e:
            print(f"Error analyzing PDF: {str(e)}")
            return Response(
                {'error': f'Failed to analyze PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatWithPDFView(APIView):
    """
    Chat with AI about PDF content
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        question = request.data.get('question')
        pdf_url = request.data.get('pdf_url')
        book_id = request.data.get('book_id')
        file_name = request.data.get('file_name', 'document.pdf')
        
        if not question:
            return Response(
                {'error': 'Question is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not pdf_url:
            return Response(
                {'error': 'PDF URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get PDF content from cache
            pdf_hash = hashlib.md5(pdf_url.encode()).hexdigest()
            cache_key = f'pdf_content_{pdf_hash}'
            pdf_content = cache.get(cache_key)
            
            if not pdf_content:
                # If not cached, try to analyze it first
                return Response(
                    {'error': 'PDF not analyzed yet. Please wait for analysis to complete.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get metadata
            metadata_key = f'pdf_metadata_{pdf_hash}'
            metadata = cache.get(metadata_key, {})
            
            # Get API key
            key_manager = get_key_manager()
            api_key = key_manager.get_current_key()
            if not api_key:
                return Response(
                    {'error': 'No API keys available'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            # Configure Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Create prompt with PDF content
            prompt = f"""You are an AI learning assistant helping students understand educational content.

Book/Document: {file_name}
Total Pages: {metadata.get('pages', 'Unknown')}

PDF Content:
{pdf_content}

---

Student Question: {question}

Instructions:
1. Answer the question based ONLY on the PDF content provided above
2. If the answer is in Bengali content, respond in Bengali (বাংলা)
3. If the answer is in English content, respond in English
4. Provide clear, educational explanations
5. If the question cannot be answered from the PDF content, say so politely
6. Include relevant page references if possible
7. Use simple language suitable for students
8. Format your response clearly with paragraphs

Answer:"""
            
            # Generate response
            response = model.generate_content(prompt)
            answer = response.text
            
            # Remove markdown formatting for cleaner display
            answer = answer.replace('**', '').replace('*', '').replace('#', '')
            
            return Response({
                'answer': answer,
                'book_name': file_name,
                'pages': metadata.get('pages', 'Unknown')
            })
            
        except Exception as e:
            print(f"Error in chat: {str(e)}")
            
            # Check if it's a quota error
            if '429' in str(e) or 'quota' in str(e).lower():
                key_manager = get_key_manager()
                key_manager.rotate_key()
                return Response(
                    {'error': 'API quota exceeded. Please try again in a moment.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            return Response(
                {'error': f'Failed to generate response: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClearPDFCacheView(APIView):
    """
    Clear cached PDF content (admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_admin:
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pdf_url = request.data.get('pdf_url')
        if pdf_url:
            # Clear specific PDF
            pdf_hash = hashlib.md5(pdf_url.encode()).hexdigest()
            cache.delete(f'pdf_content_{pdf_hash}')
            cache.delete(f'pdf_metadata_{pdf_hash}')
            return Response({'message': 'PDF cache cleared'})
        else:
            # Clear all PDF caches (use with caution)
            cache.clear()
            return Response({'message': 'All caches cleared'})
