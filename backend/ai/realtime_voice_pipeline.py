"""
Realtime voice tutor orchestration pipeline.
Implements stage-wise provider fallback for STT -> LLM -> TTS.
"""

import logging
import os
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings
from django.utils import timezone

from .ai_service import get_ai_service
from .models import (
    ProviderSettings,
    UserProfile,
    ConversationThread,
    Message,
    ConversationSummary,
    VoiceConversationMessage,
    VoiceConversationSession,
)
from .voice_conversation_service import (
    ConversationSummaryGenerator,
    VoiceConversationContextManager,
)

logger = logging.getLogger(__name__)


class RealtimeVoiceTutorPipeline:
    DEFAULT_STT_ORDER = ("deepgram", "sarvam")
    DEFAULT_LLM_ORDER = ("alibaba", "groq")
    DEFAULT_TTS_ORDER = ("gemini", "sarvam")

    def __init__(self):
        self.ai_service = get_ai_service()

    def _ordered_providers(self, selected: str, default_order: Tuple[str, ...]) -> List[str]:
        if selected and selected != "auto" and selected in default_order:
            return [selected] + [provider for provider in default_order if provider != selected]
        return list(default_order)

    def _provider_settings(self) -> Dict[str, Optional[str]]:
        # API keys should be stored in .env and optionally overridden in the admin settings.
        settings_obj = ProviderSettings.get_settings()
        return {
            "voice_stt_provider": settings_obj.voice_stt_provider or "auto",
            "voice_llm_provider": settings_obj.voice_llm_provider or "auto",
            "voice_tts_provider": settings_obj.voice_tts_provider or "auto",
            "voice_ai_provider": settings_obj.voice_ai_provider or "auto",
            "deepgram_api_key": settings_obj.deepgram_api_key or getattr(settings, "DEEPGRAM_API_KEY", None),
            "sarvam_api_key": settings_obj.sarvam_api_key or getattr(settings, "SARVAM_API_KEY", None),
            "alibaba_api_key": settings_obj.alibaba_api_key or getattr(settings, "ALIBABA_API_KEY", None),
            "groq_api_key": settings_obj.groq_api_key or getattr(settings, "GROQ_API_KEY", None),
            "gemini_api_key": settings_obj.gemini_api_key or getattr(settings, "GEMINI_API_KEY", None),
        }

    def _ensure_profile(self, user) -> UserProfile:
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                "preferred_language": "bn",
            },
        )
        return profile

    def _ensure_thread(self, session: VoiceConversationSession) -> ConversationThread:
        profile = self._ensure_profile(session.user)
        thread, created = ConversationThread.objects.get_or_create(
            voice_session=session,
            defaults={
                "user_profile": profile,
                "subject": session.subject or "",
                "topic": session.topic or "",
                "mode": session.mode,
                "thread_title": session.topic or session.subject or "Bangla Voice Tutor",
            },
        )
        if not created:
            updates = []
            if thread.subject != (session.subject or ""):
                thread.subject = session.subject or ""
                updates.append("subject")
            if thread.topic != (session.topic or ""):
                thread.topic = session.topic or ""
                updates.append("topic")
            if thread.mode != session.mode:
                thread.mode = session.mode
                updates.append("mode")
            if updates:
                thread.save(update_fields=updates + ["updated_at"])

        profile.last_active_at = timezone.now()
        profile.save(update_fields=["last_active_at", "updated_at"])
        return thread

    def _thread_memory_snapshot(self, thread: ConversationThread) -> str:
        if thread.memory_snapshot:
            return thread.memory_snapshot

        summary = (
            ConversationSummary.objects.filter(thread=thread)
            .order_by("-created_at")
            .first()
        )
        return summary.summary_text if summary else ""

    def _is_retryable_error(self, error_message: str) -> bool:
        message = (error_message or "").lower()
        retryable_tokens = [
            "429",
            "rate limit",
            "timeout",
            "temporarily unavailable",
            "502",
            "503",
            "504",
            "connection",
        ]
        return any(token in message for token in retryable_tokens)

    def _build_system_prompt(
        self,
        session: VoiceConversationSession,
        user_message: str,
        context: Dict,
    ) -> str:
        recent_messages = list(session.messages.order_by("-timestamp")[:8])
        recent_messages.reverse()

        history_lines = []
        for message in recent_messages:
            sender = "Student" if message.is_user_message else "Tutor"
            history_lines.append(f"{sender}: {message.message_text[:300]}")

        session_summary = session.conversation_summary or ""
        previous_context = session.previous_session_context or ""

        mode_instructions = {
            "tutor": "Use Socratic style: ask one guiding question before final explanation whenever possible.",
            "exam": "Run exam coaching: evaluate accuracy briefly, explain mistakes, then ask the next focused question.",
            "quiz": "Run quiz coach mode: short feedback, correctness, memory trick, and one follow-up challenge.",
            "general": "Be concise and conversational while still educational.",
        }

        instruction = mode_instructions.get(session.mode, mode_instructions["tutor"])

        return f"""আপনি MedhaBangla এর Real-time AI Bangla Voice Tutor।

কোর নির্দেশনা:
- উত্তর প্রধানত বাংলা ভাষায় দিন, প্রয়োজনে ইংরেজি টার্মের সহজ ব্যাখ্যা দিন।
- শিক্ষার্থীকে ছোট ধাপে শেখান এবং চিন্তা করতে উৎসাহ দিন।
- উত্তর সংক্ষিপ্ত, স্পষ্ট, এবং ভয়েসে শোনার উপযোগী রাখুন।
- ভুল ধরলে সমালোচনা নয়, সহানুভূতিশীল সংশোধন দিন।
- NCTB/বাংলাদেশ স্কুল কনটেক্সট মাথায় রাখুন।
- {instruction}

শিক্ষার্থী তথ্য:
- নাম: {context.get('student_name', 'Student')}
- শ্রেণি: {context.get('student_class', 9)}
- বিষয়: {session.subject or 'General'}
- টপিক: {session.topic or 'General'}
- দুর্বল দিক: {', '.join(context.get('weak_areas', [])[:3]) or 'Not identified'}
- শক্তিশালী দিক: {', '.join(context.get('strong_areas', [])[:3]) or 'Not identified'}

পূর্ববর্তী সেশন সংক্ষেপ:
{previous_context or 'N/A'}

চলমান সেশন সংক্ষেপ:
{session_summary or 'N/A'}

সাম্প্রতিক কথোপকথন:
{os.linesep.join(history_lines) or 'No prior turns'}

শিক্ষার্থীর বর্তমান ইনপুট:
{user_message}

এখন 3-6 লাইনের ভয়েস-ফ্রেন্ডলি সহায়ক উত্তর দিন।"""

    def _transcribe_with_deepgram(self, audio_bytes: bytes, mime_type: str, api_key: str) -> str:
        url = os.getenv("DEEPGRAM_STT_URL", "https://api.deepgram.com/v1/listen")
        params = {
            "model": os.getenv("DEEPGRAM_STT_MODEL", "nova-2"),
            "language": os.getenv("DEEPGRAM_STT_LANGUAGE", "bn"),
            "smart_format": "true",
            "punctuate": "true",
        }

        response = requests.post(
            url,
            params=params,
            headers={
                "Authorization": f"Token {api_key}",
                "Content-Type": mime_type or "audio/webm",
            },
            data=audio_bytes,
            timeout=35,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Deepgram STT error: {response.status_code} - {response.text[:300]}")

        payload = response.json()
        transcript = (
            payload.get("results", {})
            .get("channels", [{}])[0]
            .get("alternatives", [{}])[0]
            .get("transcript", "")
            .strip()
        )

        if not transcript:
            raise RuntimeError("Deepgram STT returned empty transcript")

        return transcript

    def _transcribe_with_sarvam(self, audio_bytes: bytes, mime_type: str, api_key: str) -> str:
        url = os.getenv("SARVAM_STT_URL", "https://api.sarvam.ai/speech-to-text")
        language_code = os.getenv("SARVAM_STT_LANGUAGE", "bn-IN")

        files = {
            "file": ("voice-input.webm", audio_bytes, mime_type or "audio/webm"),
        }
        data = {
            "language_code": language_code,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "api-subscription-key": api_key,
        }

        response = requests.post(url, headers=headers, files=files, data=data, timeout=35)

        if response.status_code != 200:
            raise RuntimeError(f"Sarvam STT error: {response.status_code} - {response.text[:300]}")

        payload = response.json()

        transcript = payload.get("transcript") or payload.get("text")
        if not transcript and isinstance(payload.get("data"), dict):
            transcript = payload["data"].get("transcript") or payload["data"].get("text")
        if not transcript and isinstance(payload.get("results"), list):
            transcript = " ".join(
                str(item.get("transcript", "")).strip()
                for item in payload["results"]
                if isinstance(item, dict)
            ).strip()

        transcript = (transcript or "").strip()
        if not transcript:
            raise RuntimeError("Sarvam STT returned empty transcript")

        return transcript

    def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str,
        provider_settings: Dict[str, Optional[str]],
    ) -> Tuple[Optional[str], Optional[str], List[str]]:
        selected = provider_settings.get("voice_stt_provider") or "auto"
        order = self._ordered_providers(selected, self.DEFAULT_STT_ORDER)

        errors: List[str] = []
        for provider in order:
            try:
                if provider == "deepgram":
                    api_key = provider_settings.get("deepgram_api_key")
                    if not api_key:
                        raise RuntimeError("Deepgram API key missing")
                    transcript = self._transcribe_with_deepgram(audio_bytes, mime_type, api_key)
                    return transcript, provider, errors

                if provider == "sarvam":
                    api_key = provider_settings.get("sarvam_api_key")
                    if not api_key:
                        raise RuntimeError("Sarvam API key missing")
                    transcript = self._transcribe_with_sarvam(audio_bytes, mime_type, api_key)
                    return transcript, provider, errors

            except Exception as exc:
                error_message = f"{provider}: {exc}"
                errors.append(error_message)
                logger.warning("STT provider failed - %s", error_message)

                if not self._is_retryable_error(str(exc)) and provider == order[-1]:
                    break

        return None, None, errors

    def _generate_with_alibaba(self, prompt: str, api_key: Optional[str]) -> Tuple[bool, str, str]:
        return self.ai_service.generate_with_alibaba(
            prompt,
            timeout=60,
            model_name=os.getenv("VOICE_QWEN_MODEL", "qwen-turbo"),
            api_key_override=api_key,
        )

    def _generate_with_groq(self, prompt: str, api_key: Optional[str]) -> Tuple[bool, str, str]:
        return self.ai_service.generate_with_groq(
            prompt,
            timeout=60,
            model_name=os.getenv("VOICE_GROQ_MODEL", getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile")),
            api_key_override=api_key,
        )

    def generate_response(
        self,
        session: VoiceConversationSession,
        user_text: str,
        provider_settings: Dict[str, Optional[str]],
    ) -> Tuple[Optional[str], Optional[str], List[str]]:
        selected = provider_settings.get("voice_llm_provider") or "auto"
        if selected == "auto":
            legacy_selected = provider_settings.get("voice_ai_provider")
            if legacy_selected in self.DEFAULT_LLM_ORDER:
                selected = legacy_selected

        order = self._ordered_providers(selected, self.DEFAULT_LLM_ORDER)

        context = VoiceConversationContextManager.get_student_context(
            user=session.user,
            subject=session.subject or "",
            topic=session.topic or "",
        )
        prompt = self._build_system_prompt(session, user_text, context)

        errors: List[str] = []
        for provider in order:
            try:
                if provider == "alibaba":
                    success, response, error = self._generate_with_alibaba(
                        prompt,
                        provider_settings.get("alibaba_api_key"),
                    )
                elif provider == "groq":
                    success, response, error = self._generate_with_groq(
                        prompt,
                        provider_settings.get("groq_api_key"),
                    )
                else:
                    success, response, error = (False, "", f"Unsupported LLM provider: {provider}")

                if success and response.strip():
                    return response.strip(), provider, errors

                errors.append(f"{provider}: {error or 'Empty response'}")
                logger.warning("LLM provider failed - %s", errors[-1])
            except Exception as exc:
                error_message = f"{provider}: {exc}"
                errors.append(error_message)
                logger.warning("LLM provider exception - %s", error_message)

        return None, None, errors

    def _gemini_tts(self, text: str, api_key: str) -> Tuple[str, str]:
        url = (
            os.getenv("GEMINI_TTS_URL")
            or "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent"
        )
        voice_name = os.getenv("GEMINI_TTS_VOICE", "Kore")

        response = requests.post(
            f"{url}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": text}]}],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": voice_name,
                            }
                        }
                    },
                },
            },
            timeout=40,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Gemini TTS error: {response.status_code} - {response.text[:300]}")

        payload = response.json()
        parts = (
            payload.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [])
        )
        for part in parts:
            inline_data = part.get("inlineData") or part.get("inline_data")
            if isinstance(inline_data, dict) and inline_data.get("data"):
                return inline_data["data"], inline_data.get("mimeType", "audio/wav")

        raise RuntimeError("Gemini TTS returned no audio content")

    def _sarvam_tts(self, text: str, api_key: str) -> Tuple[str, str]:
        url = os.getenv("SARVAM_TTS_URL", "https://api.sarvam.ai/text-to-speech")
        language_code = os.getenv("SARVAM_TTS_LANGUAGE", "bn-IN")
        speaker = os.getenv("SARVAM_TTS_SPEAKER", "anushka")

        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "api-subscription-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "target_language_code": language_code,
                "speaker": speaker,
            },
            timeout=40,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Sarvam TTS error: {response.status_code} - {response.text[:300]}")

        content_type = response.headers.get("Content-Type", "")
        if content_type.startswith("audio/"):
            import base64

            return base64.b64encode(response.content).decode("utf-8"), content_type

        payload = response.json()
        audio_base64 = (
            payload.get("audio")
            or payload.get("audio_base64")
            or payload.get("data", {}).get("audio")
            or payload.get("data", {}).get("audio_base64")
        )
        if not audio_base64:
            raise RuntimeError("Sarvam TTS returned no audio payload")

        mime_type = payload.get("mime_type") or payload.get("content_type") or "audio/mpeg"
        return audio_base64, mime_type

    def synthesize_audio(
        self,
        text: str,
        provider_settings: Dict[str, Optional[str]],
    ) -> Tuple[Optional[str], Optional[str], Optional[str], List[str]]:
        selected = provider_settings.get("voice_tts_provider") or "auto"
        order = self._ordered_providers(selected, self.DEFAULT_TTS_ORDER)

        errors: List[str] = []
        for provider in order:
            try:
                if provider == "gemini":
                    api_key = provider_settings.get("gemini_api_key")
                    if not api_key:
                        raise RuntimeError("Gemini API key missing")
                    audio_base64, mime_type = self._gemini_tts(text, api_key)
                    return audio_base64, mime_type, provider, errors

                if provider == "sarvam":
                    api_key = provider_settings.get("sarvam_api_key")
                    if not api_key:
                        raise RuntimeError("Sarvam API key missing")
                    audio_base64, mime_type = self._sarvam_tts(text, api_key)
                    return audio_base64, mime_type, provider, errors

            except Exception as exc:
                error_message = f"{provider}: {exc}"
                errors.append(error_message)
                logger.warning("TTS provider failed - %s", error_message)

        return None, None, None, errors

    def _upsert_summary(self, session: VoiceConversationSession, summary_data: Dict) -> None:
        if not summary_data:
            return

        session.conversation_summary = summary_data.get("summary", "")
        session.key_points = summary_data.get("key_concepts", [])
        session.save(update_fields=["conversation_summary", "key_points", "updated_at"])

        ConversationSummary.objects.update_or_create(
            user=session.user,
            voice_session=session,
            defaults={
                "summary_text": summary_data.get("summary", ""),
                "key_concepts": summary_data.get("key_concepts", []),
                "doubts_cleared": summary_data.get("doubts_cleared", []),
                "weak_concepts": summary_data.get("weak_areas", []),
                "strong_concepts": summary_data.get("strong_areas", []),
                "next_topics_to_study": summary_data.get("next_topics_recommended", []),
                "learning_insights": summary_data.get("learning_insights", ""),
                "study_recommendations": summary_data.get("study_recommendations", ""),
                "practice_questions_suggested": summary_data.get("practice_suggestions", []),
            },
        )

    def maybe_generate_incremental_summary(self, session: VoiceConversationSession) -> None:
        total_messages = session.messages.count()
        if total_messages == 0 or total_messages % 20 != 0:
            return

        context = VoiceConversationContextManager.get_student_context(
            user=session.user,
            subject=session.subject or "",
            topic=session.topic or "",
        )
        summary_data = ConversationSummaryGenerator.generate_session_summary(
            session=session,
            context=context,
            ai_service=self.ai_service,
        )
        if summary_data:
            self._upsert_summary(session, summary_data)

    def process_turn(
        self,
        *,
        session_id: str,
        user_id: int,
        text_message: Optional[str] = None,
        audio_bytes: Optional[bytes] = None,
        audio_mime_type: str = "audio/webm",
    ) -> Dict:
        session = VoiceConversationSession.objects.get(
            session_id=session_id,
            user_id=user_id,
        )

        if not session.is_active:
            raise ValueError("Session is not active")

        provider_settings = self._provider_settings()

        transcript = (text_message or "").strip()
        stt_provider = None
        stt_errors: List[str] = []

        if not transcript:
            if not audio_bytes:
                raise ValueError("No text or audio provided")
            transcript, stt_provider, stt_errors = self.transcribe_audio(
                audio_bytes,
                audio_mime_type,
                provider_settings,
            )
            transcript = (transcript or "").strip()

        if not transcript:
            raise ValueError("Speech could not be transcribed")

        VoiceConversationMessage.objects.create(
            session=session,
            message_text=transcript,
            message_type="question" if session.mode == "tutor" else "quiz_question",
            is_user_message=True,
            transcript=transcript,
        )

        response_text, llm_provider, llm_errors = self.generate_response(
            session=session,
            user_text=transcript,
            provider_settings=provider_settings,
        )

        if not response_text:
            response_text = (
                "আমি এখনই উত্তর তৈরি করতে পারছি না। একটু পরে আবার চেষ্টা করো।"
            )

        ai_message = VoiceConversationMessage.objects.create(
            session=session,
            message_text=response_text,
            message_type="answer",
            is_user_message=False,
            ai_response=response_text,
            confidence_score=0.85 if llm_provider else 0.0,
        )

        session.total_questions_asked += 1
        session.save(update_fields=["total_questions_asked", "updated_at"])

        self.maybe_generate_incremental_summary(session)

        audio_base64, audio_mime_type, tts_provider, tts_errors = self.synthesize_audio(
            response_text,
            provider_settings,
        )

        return {
            "session_id": session.session_id,
            "transcript": transcript,
            "ai_message_id": ai_message.id,
            "response_text": response_text,
            "audio_base64": audio_base64,
            "audio_mime_type": audio_mime_type,
            "providers": {
                "stt": stt_provider,
                "llm": llm_provider,
                "tts": tts_provider,
            },
            "fallback_errors": {
                "stt": stt_errors,
                "llm": llm_errors,
                "tts": tts_errors,
            },
            "mode": session.mode,
        }


def get_realtime_voice_pipeline() -> RealtimeVoiceTutorPipeline:
    return RealtimeVoiceTutorPipeline()
