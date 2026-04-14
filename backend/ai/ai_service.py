
"""
AI Service - Configurable AI Provider
Supports Gemini, Ollama, Groq, Alibaba Cloud (Qwen) based on admin settings
"""
import os
import warnings
import requests
import base64
import re
from django.conf import settings

# Suppress Gemini deprecation warning
warnings.filterwarnings('ignore', category=FutureWarning)

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
                'voice_ai_provider': settings_obj.voice_ai_provider,
                'study_plan_provider': settings_obj.study_plan_provider,
                'quiz_flashcard_provider': settings_obj.quiz_flashcard_provider,
                'doc_vision_provider': settings_obj.doc_vision_provider,
                'general_chat_provider': settings_obj.general_chat_provider,
                'chat_page_provider': settings_obj.chat_page_provider,
                'gemini_api_key': settings_obj.gemini_api_key,
                'groq_api_key': settings_obj.groq_api_key,
                'alibaba_api_key': settings_obj.alibaba_api_key,
                'elevenlabs_api_key': settings_obj.elevenlabs_api_key,
                'flashcard_gemini_extra_keys': settings_obj.flashcard_gemini_extra_keys,
                'flashcard_groq_extra_keys': settings_obj.flashcard_groq_extra_keys,
                'flashcard_alibaba_extra_keys': settings_obj.flashcard_alibaba_extra_keys,
                'ollama_base_url': settings_obj.ollama_base_url,
                'ollama_username': settings_obj.ollama_username,
                'ollama_password': settings_obj.ollama_password,
                'ollama_model': settings_obj.ollama_model,
            }
        except Exception as e:
            print(f"[AI Service] Could not load settings: {e}, using defaults")
            return {
                'provider': 'auto',
                'chat_page_provider': 'auto',
                'groq_model': getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
                'flashcard_gemini_extra_keys': '',
                'flashcard_groq_extra_keys': '',
                'flashcard_alibaba_extra_keys': '',
                'elevenlabs_api_key': getattr(settings, 'ELEVENLABS_API_KEY', None),
                'ollama_base_url': os.getenv('OLLAMA_BASE_URL', 'http://51.21.208.44'),
                'ollama_username': os.getenv('OLLAMA_USERNAME', 'bipul'),
                'ollama_password': os.getenv('OLLAMA_PASSWORD', 'Bipul$'),
                'ollama_model': os.getenv('OLLAMA_MODEL', 'llama3'),
            }

    def _parse_key_list(self, value):
        if not value:
            return []

        parts = re.split(r'[\n,]+', str(value))
        keys = []
        for raw in parts:
            key = raw.strip()
            if key and key not in keys:
                keys.append(key)
        return keys

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

    def generate_with_elevenlabs(self, prompt, timeout=120, model_name='eleven_multilingual_v2', api_key_override=None):
        """Attempt ElevenLabs text generation and gracefully fallback if unavailable."""
        api_key = api_key_override or getattr(settings, 'ELEVENLABS_API_KEY', None)
        if not api_key:
            return False, '', 'ElevenLabs API key not configured'

        headers = {
            'xi-api-key': api_key,
            'Content-Type': 'application/json',
        }

        payload = {
            'text': prompt,
            'model_id': model_name,
        }

        candidate_urls = [
            'https://api.elevenlabs.io/v1/text-generation',
            f'https://api.elevenlabs.io/v1/text-generation/{model_name}',
        ]

        last_error = 'ElevenLabs text endpoint is unavailable'
        for url in candidate_urls:
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=timeout)
                if response.status_code != 200:
                    last_error = f'ElevenLabs error: {response.status_code} - {response.text[:200]}'
                    continue

                data = response.json()
                content = (
                    data.get('generated_text')
                    or data.get('text')
                    or data.get('output_text')
                    or data.get('output', {}).get('text')
                    or data.get('response')
                )
                if content:
                    return True, content, None

                last_error = 'ElevenLabs returned empty text output'
            except Exception as exc:
                last_error = f'ElevenLabs error: {str(exc)}'

        return False, '', last_error

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

        api_keys = {
            'gemini': config.get('gemini_api_key'),
            'groq': config.get('groq_api_key'),
            'alibaba': config.get('alibaba_api_key'),
            'elevenlabs': config.get('elevenlabs_api_key'),
        }
        print(f"[AI Service] Keys overrides found: {[(k, bool(v)) for k, v in api_keys.items()]}")

        provider_key_pool = {}
        for provider_name in ('gemini', 'groq', 'alibaba', 'elevenlabs'):
            key_candidates = []
            primary_key = api_keys.get(provider_name)
            if primary_key:
                key_candidates.append(primary_key)

            if feature_type == 'quiz_flashcard_provider':
                extra_key_field = f'flashcard_{provider_name}_extra_keys'
                for extra_key in self._parse_key_list(config.get(extra_key_field)):
                    if extra_key not in key_candidates:
                        key_candidates.append(extra_key)

            if not key_candidates:
                key_candidates = [None]

            provider_key_pool[provider_name] = key_candidates

        if feature_type == 'quiz_flashcard_provider':
            print(
                "[AI Service] Flashcard key pool sizes: "
                f"{[(name, len(keys)) for name, keys in provider_key_pool.items()]}"
            )

        def _try_provider(provider_name, api_key_override=None):
            if provider_name == 'groq':
                return self.generate_with_groq(prompt, timeout, api_key_override=api_key_override)
            if provider_name == 'gemini':
                return self.generate_with_gemini(prompt, model_name, api_key_override=api_key_override)
            if provider_name == 'alibaba':
                return self.generate_with_alibaba(prompt, timeout, api_key_override=api_key_override)
            if provider_name == 'elevenlabs':
                return self.generate_with_elevenlabs(prompt, timeout, api_key_override=api_key_override)
            if provider_name == 'ollama':
                return self.generate_with_ollama(prompt, timeout)
            return False, '', f'Unknown provider: {provider_name}'

        provider_order = ['groq', 'gemini', 'alibaba', 'elevenlabs', 'ollama']
        if target_provider == 'auto':
            ordered_providers = provider_order
        else:
            ordered_providers = [target_provider] + [p for p in provider_order if p != target_provider]

        errors = {}
        for provider_name in ordered_providers:
            if provider_name in provider_key_pool:
                attempt_errors = []
                for key_candidate in provider_key_pool[provider_name]:
                    success, response, error = _try_provider(provider_name, key_candidate)
                    if success:
                        return True, response, None, provider_name
                    attempt_errors.append(error)

                errors[provider_name] = ' | '.join(str(err) for err in attempt_errors if err)
                continue

            success, response, error = _try_provider(provider_name)
            if success:
                return True, response, None, provider_name
            errors[provider_name] = error

        error_message = '; '.join([f"{name} fail: {err}" for name, err in errors.items()])
        return False, '', error_message, 'none'

_ai_service = None
def get_ai_service():
    global _ai_service
    if _ai_service is None: _ai_service = AIService()
    return _ai_service
