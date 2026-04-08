"""
AI Service - Configurable AI Provider
Supports Gemini, Ollama, or Auto (with fallback) based on admin settings
"""
import os
import warnings
import requests
import base64
from django.conf import settings

# Suppress Gemini deprecation warning
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai


class AIService:
    """
    Configurable AI service that uses admin-selected provider
    """
    
    def __init__(self):
        self.gemini_configured = False
        self.ollama_config = None
        self.provider_setting = 'auto'  # Default
        
    def get_provider_settings(self):
        """Get current AI provider settings from database"""
        try:
            from .models import AIProviderSettings
            settings_obj = AIProviderSettings.get_settings()
            return {
                'provider': settings_obj.provider,
                'ollama_base_url': settings_obj.ollama_base_url,
                'ollama_username': settings_obj.ollama_username,
                'ollama_password': settings_obj.ollama_password,
                'ollama_model': settings_obj.ollama_model,
            }
        except Exception as e:
            print(f"[AI Service] Could not load settings: {e}, using defaults")
            return {
                'provider': 'auto',
                'groq_model': getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                'ollama_base_url': os.getenv('OLLAMA_BASE_URL', 'http://51.21.208.44'),
                'ollama_username': os.getenv('OLLAMA_USERNAME', 'bipul'),
                'ollama_password': os.getenv('OLLAMA_PASSWORD', 'Bipul$Ollama$Roy$2026$'),
                'ollama_model': os.getenv('OLLAMA_MODEL', 'llama3'),
            }

    def generate_with_groq(self, prompt, timeout=120, model_name=None):
        """Generate using Groq's OpenAI-compatible API"""
        api_key = getattr(settings, 'GROQ_API_KEY', None)
        if not api_key:
            return False, '', 'Groq API key not configured'

        groq_model = model_name or getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile')

        try:
            response = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': groq_model,
                    'messages': [
                        {'role': 'user', 'content': prompt},
                    ],
                    'temperature': 0.7,
                    'stream': False,
                },
                timeout=timeout,
            )

            if response.status_code != 200:
                try:
                    error_data = response.json()
                    error_detail = error_data.get('error', {}).get('message') or error_data.get('message') or response.text
                except Exception:
                    error_detail = response.text
                return False, '', f"Groq API error: {response.status_code} - {error_detail}"

            data = response.json()
            choices = data.get('choices', [])
            if not choices:
                return False, '', 'Groq API returned no choices'

            message = choices[0].get('message', {})
            content = message.get('content', '')
            if not content:
                return False, '', 'Groq API returned an empty response'

            return True, content, None

        except requests.exceptions.Timeout:
            return False, '', 'Request timeout - Groq server took too long to respond'
        except requests.exceptions.ConnectionError:
            return False, '', 'Connection error - Cannot reach Groq server'
        except Exception as e:
            return False, '', f'Groq error: {str(e)}'
    
    def generate_with_ollama(self, prompt, timeout=120):
        """
        Generate using Ollama (direct connection like Ollama.tsx)
        """
        try:
            config = self.get_provider_settings()
            
            # Create Basic Auth (same as Ollama.tsx)
            credentials = f"{config['ollama_username']}:{config['ollama_password']}"
            basic_auth = 'Basic ' + base64.b64encode(credentials.encode()).decode()
            
            print(f"[AI Service] Calling Ollama at {config['ollama_base_url']}...")
            
            response = requests.post(
                f"{config['ollama_base_url']}/api/generate",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': basic_auth
                },
                json={
                    'model': config['ollama_model'],
                    'prompt': prompt,
                    'stream': False
                },
                timeout=timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get('response', ''), None
            else:
                error_msg = f"Ollama API error: {response.status_code}"
                return False, '', error_msg
                
        except requests.exceptions.Timeout:
            return False, '', "Request timeout - Ollama server took too long to respond"
        except requests.exceptions.ConnectionError:
            return False, '', "Connection error - Cannot reach Ollama server. Please check if EC2 instance is running."
        except Exception as e:
            return False, '', f"Ollama error: {str(e)}"
    
    def generate_with_gemini(self, prompt, model_name='gemini-2.5-flash'):
        """
        Generate using Gemini API
        """
        try:
            try:
                from .api_key_manager import get_key_manager
                key_manager = get_key_manager()
                return key_manager.generate_content(prompt=prompt, model_name=model_name)
            except Exception:
                if not settings.GEMINI_API_KEY:
                    return False, '', 'Gemini API key not configured'

                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                ai_response = response.text
                return True, ai_response, None
        except Exception as e:
            error_msg = f"Gemini error: {str(e)}"
            return False, '', error_msg
    
    def generate(self, prompt, timeout=120, model_name='gemini-2.5-flash'):
        """
        Generate AI response based on admin settings
        
        Args:
            prompt (str): The prompt
            timeout (int): Timeout in seconds
            model_name (str): Gemini model name
            
        Returns:
            tuple: (success: bool, response: str, error: str, source: str)
        """
        config = self.get_provider_settings()
        provider = config['provider']

        print(f"[AI Service] Provider setting: {provider}")

        print(f"[AI Service] Trying Groq first...")
        success, response, error = self.generate_with_groq(prompt, timeout, model_name=config.get('groq_model') or None)
        if success:
            print(f"[AI Service] ✅ Groq responded successfully")
            return True, response, None, 'groq'

        print(f"[AI Service] ❌ Groq failed: {error}")
        print(f"[AI Service] Falling back to Gemini...")
        success, response, gemini_error = self.generate_with_gemini(prompt, model_name)
        if success:
            print(f"[AI Service] ✅ Gemini responded successfully")
            return True, response, None, 'gemini'

        print(f"[AI Service] ❌ Gemini failed: {gemini_error}")
        print(f"[AI Service] Falling back to Ollama...")
        success, response, ollama_error = self.generate_with_ollama(prompt, timeout)
        if success:
            print(f"[AI Service] ✅ Ollama responded successfully")
            return True, response, None, 'ollama'

        print(f"[AI Service] ❌ Ollama also failed: {ollama_error}")
        return False, '', f"Groq failed: {error}; Gemini failed: {gemini_error}; Ollama failed: {ollama_error}", 'none'


# Global instance
_ai_service = None


def get_ai_service():
    """Get or create global AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
