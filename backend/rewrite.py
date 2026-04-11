import re

new_code = '''
\"\"\"
AI Service - Configurable AI Provider
Supports Gemini, Ollama, Groq, Alibaba Cloud (Qwen) based on admin settings
\"\"\"
import os
import warnings
import requests
import base64
from django.conf import settings

# Suppress Gemini deprecation warning
warnings.filterwarnings('ignore', category=FutureWarning)

import google.generativeai as genai


class AIService:
    \"\"\"
    Configurable AI service that uses admin-selected provider
    \"\"\"

    def __init__(self):
        self.gemini_configured = False
        self.ollama_config = None
        self.provider_setting = 'auto'  # Default

    def get_provider_settings(self):
        \"\"\"Get current AI provider settings from database\"\"\"
        try:
            from .models import AIProviderSettings
            settings_obj = AIProviderSettings.get_settings()
            return {
                'provider': settings_obj.provider,
                'voice_ai_provider': settings_obj.voice_ai_provider,
                'study_plan_provider': settings_obj.study_plan_provider,
                'quiz_flashcard_provider': settings_obj.quiz_flashcard_provider,
                'doc_vision_provider': settings_obj.doc_vision_provider,
                'general_chat_provider': settings_obj.general_chat_provider,
                'gemini_api_key': settings_obj.gemini_api_key,
                'groq_api_key': settings_obj.groq_api_key,
                'alibaba_api_key': settings_obj.alibaba_api_key,
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
                'ollama_password': os.getenv('OLLAMA_PASSWORD', 'Bipul$'),
                'ollama_model': os.getenv('OLLAMA_MODEL', 'llama3'),
            }

    def generate_with_groq(self, prompt, timeout=120, model_name=None, api_key_override=None):
        api_key = api_key_override or getattr(settings, 'GROQ_API_KEY', None)
        if not api_key: return False, '', 'Groq API key not configured'

        groq_model = model_name or getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile')

        try:
            response = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
                json={'model': groq_model, 'messages': [{'role': 'user', 'content': prompt}], 'temperature': 0.7, 'stream': False},
                timeout=timeout,
            )

            if response.status_code != 200:
                try: error_detail = response.json().get('error', {}).get('message') or response.text
                except: error_detail = response.text
                return False, '', f"Groq error: {response.status_code} - {error_detail}"

            data = response.json()
            return True, data.get('choices', [])[0].get('message', {}).get('content', ''), None

        except requests.exceptions.Timeout: return False, '', 'Groq request timeout'
        except Exception as e: return False, '', f'Groq error: {str(e)}'

    def generate_with_alibaba(self, prompt, timeout=120, model_name='qwen-turbo', api_key_override=None):
        api_key = api_key_override or getattr(settings, 'ALIBABA_API_KEY', None)
        if not api_key: return False, '', 'Alibaba DashScope API key not configured'
        try:
            response = requests.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
                json={'model': model_name, 'input': {'prompt': prompt}, 'parameters': {'temperature': 0.7, 'result_format': 'message'}},
                timeout=timeout,
            )

            if response.status_code != 200: return False, '', f"Alibaba error: {response.status_code} - {response.text}"

            data = response.json()
            content = data.get('output', {}).get('choices', [])[0].get('message', {}).get('content', '')
            if not content: content = data.get('output', {}).get('text')
            return True, content, None
        except Exception as e: return False, '', f'Alibaba error: {str(e)}'

    def generate_with_ollama(self, prompt, timeout=120):
        try:
            config = self.get_provider_settings()
            credentials = f"{config.get('ollama_username')}:{config.get('ollama_password')}"
            basic_auth = 'Basic ' + base64.b64encode(credentials.encode()).decode()

            response = requests.post(
                f"{config.get('ollama_base_url')}/api/generate",
                headers={'Content-Type': 'application/json', 'Authorization': basic_auth},
                json={'model': config.get('ollama_model', 'llama3'), 'prompt': prompt, 'stream': False},
                timeout=timeout
            )
            if response.status_code == 200: return True, response.json().get('response', ''), None
            else: return False, '', f"Ollama API error: {response.status_code}"
        except Exception as e: return False, '', f"Ollama error: {str(e)}"

    def generate_with_gemini(self, prompt, model_name='gemini-2.5-flash', api_key_override=None):
        try:
            # Let API manager handle keys if override is not provided
            if not api_key_override:
                try:
                    from .api_key_manager import get_key_manager
                    key_manager = get_key_manager()
                    return key_manager.generate_content(prompt=prompt, model_name=model_name)
                except Exception:
                    pass

            api_key = api_key_override or settings.GEMINI_API_KEY
            if not api_key: return False, '', 'Gemini API key not configured'

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return True, response.text, None
        except Exception as e: return False, '', f"Gemini error: {str(e)}"

    def generate(self, prompt, timeout=120, model_name='gemini-2.5-flash', feature_type=None):
        config = self.get_provider_settings()
        target_provider = 'auto'
        if feature_type and config.get(feature_type) and config.get(feature_type) != 'auto':
            target_provider = config.get(feature_type)
        else:
            target_provider = config.get('provider', 'auto')

        print(f"[AI Service] Targeting Provider: {target_provider} for feature: {feature_type or 'General'}")

        api_keys = {'gemini': config.get('gemini_api_key'), 'groq': config.get('groq_api_key'), 'alibaba': config.get('alibaba_api_key')}
        print(f"[AI Service] Keys overrides found: {[(k, bool(v)) for k, v in api_keys.items()]}")

        if target_provider == 'groq':
            success, response, error = self.generate_with_groq(prompt, timeout, api_key_override=api_keys['groq'])
            if success: return True, response, None, 'groq'
            return False, '', error, 'groq'
        
        if target_provider == 'alibaba':
            success, response, error = self.generate_with_alibaba(prompt, timeout, api_key_override=api_keys['alibaba'])
            if success: return True, response, None, 'alibaba'
            return False, '', error, 'alibaba'

        if target_provider == 'gemini':
            success, response, error = self.generate_with_gemini(prompt, model_name, api_key_override=api_keys['gemini'])
            if success: return True, response, None, 'gemini'
            return False, '', error, 'gemini'

        if target_provider == 'ollama':
            success, response, error = self.generate_with_ollama(prompt, timeout)
            if success: return True, response, None, 'ollama'
            return False, '', error, 'ollama'

        # Auto Fallback (Groq -> Gemini -> Alibaba -> Ollama)
        success, response, error = self.generate_with_groq(prompt, timeout, api_key_override=api_keys['groq'])
        if success: return True, response, None, 'groq'

        success, response, gemini_error = self.generate_with_gemini(prompt, model_name, api_key_override=api_keys['gemini'])
        if success: return True, response, None, 'gemini'

        success, response, alibaba_error = self.generate_with_alibaba(prompt, timeout, api_key_override=api_keys['alibaba'])
        if success: return True, response, None, 'alibaba'

        success, response, ollama_error = self.generate_with_ollama(prompt, timeout)
        return success, response, f"Groq fail: {error}; Gemini fail: {gemini_error}; Alibaba fail: {alibaba_error}; Ollama fail: {ollama_error}", 'none'

_ai_service = None
def get_ai_service():
    global _ai_service
    if _ai_service is None: _ai_service = AIService()
    return _ai_service
'''

with open('ai/ai_service.py', 'w', encoding='utf-8') as f:
    f.write(new_code)
print("File updated successfully.")