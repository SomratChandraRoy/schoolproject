import os
import io
import base64
from PIL import Image
import PyPDF2
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from .models import AIProviderSettings
from .api_key_manager import get_key_manager
import google.generativeai as genai

class DocumentVisionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded. Please upload a PDF or an image.'}, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = request.FILES['file']
        prompt_instruction = request.data.get('instruction', 'Analyze this document and summarize its key points for a student.')
        file_name = file_obj.name.lower()
        file_content = file_obj.read()

        try:
            # Setup Gemini (Global Fallback or explicit Doc Vision Provider)
            provider_settings = AIProviderSettings.objects.first()
            api_key = provider_settings.gemini_api_key if provider_settings and provider_settings.gemini_api_key else None
            
            if not api_key:
                from .api_key_manager import get_key_manager
                key_manager = get_key_manager()
                api_key, _ = key_manager.get_next_key()

            if not api_key:
                return Response({'error': 'Gemini API key is not configured for Vision functionality.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')

            if file_name.endswith('.pdf'):
                # Handle PDF
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                extracted_text = ""
                for page in pdf_reader.pages:
                    extracted_text += page.extract_text() + "\n"
                
                if not extracted_text.strip():
                    return Response({'error': 'Could not extract text from the PDF. It might be scrambled or a scanned image PDF.'}, status=status.HTTP_400_BAD_REQUEST)
                
                max_chars = 100000 
                if len(extracted_text) > max_chars:
                    extracted_text = extracted_text[:max_chars] + "\n[Content truncated...]"

                full_prompt = f"{prompt_instruction}\n\nDocument Context:\n{extracted_text}"
                response = model.generate_content(full_prompt)
                
                return Response({'analysis': response.text, 'type': 'pdf'})

            elif file_name.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                # Handle Image
                img = Image.open(io.BytesIO(file_content))
                # Ensure image is in RGB mode
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                full_prompt = f"You are an AI learning assistant. Please fulfill this request about the image: {prompt_instruction}"
                response = model.generate_content([full_prompt, img])
                
                return Response({'analysis': response.text, 'type': 'image'})
            
            else:
                return Response({'error': 'Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP file.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("Document Vision Error:", str(e))
            return Response({'error': f'Failed to analyze document: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
