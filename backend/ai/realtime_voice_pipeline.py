"""
Realtime voice tutor orchestration pipeline.
Implements stage-wise provider fallback for STT -> LLM -> TTS.
"""

import asyncio
import logging
import os
import threading
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings
from django.db import close_old_connections
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
    _summary_jobs: set[int] = set()
    _summary_jobs_lock = threading.Lock()

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
            "deepgram_api_key": settings_obj.deepgram_api_key or getattr(settings, "DEEPGRAM_API_KEY", None) or os.getenv("DEEPGRAM_API_KEY"),
            "sarvam_api_key": settings_obj.sarvam_api_key or getattr(settings, "SARVAM_API_KEY", None) or os.getenv("SARVAM_API_KEY"),
            "alibaba_api_key": settings_obj.alibaba_api_key or getattr(settings, "ALIBABA_API_KEY", None) or os.getenv("ALIBABA_API_KEY"),
            "groq_api_key": settings_obj.groq_api_key or getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY"),
            "gemini_api_key": settings_obj.gemini_api_key or getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY"),
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

    def _merge_unique_topics(self, existing: List[str], incoming: List[str], *, limit: int = 10) -> List[str]:
        merged: List[str] = []
        seen = set()

        for raw_item in (existing or []) + (incoming or []):
            item = str(raw_item or "").strip()
            if not item:
                continue
            lowered = item.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            merged.append(item)
            if len(merged) >= limit:
                break

        return merged

    def _update_profile_from_summary(self, profile: UserProfile, summary_data: Dict) -> None:
        weak_areas = summary_data.get("weak_areas") or summary_data.get("weak_concepts") or []
        strong_areas = summary_data.get("strong_areas") or summary_data.get("strong_concepts") or []

        merged_weak = self._merge_unique_topics(profile.weak_areas or [], weak_areas)
        merged_strong = self._merge_unique_topics(profile.strong_areas or [], strong_areas)

        update_fields: List[str] = []
        if merged_weak != (profile.weak_areas or []):
            profile.weak_areas = merged_weak
            update_fields.append("weak_areas")

        if merged_strong != (profile.strong_areas or []):
            profile.strong_areas = merged_strong
            update_fields.append("strong_areas")

        learning_insights = str(summary_data.get("learning_insights") or "").strip()
        if learning_insights:
            profile.profile_notes = learning_insights
            update_fields.append("profile_notes")

        profile.last_active_at = timezone.now()
        update_fields.append("last_active_at")

        if update_fields:
            profile.save(update_fields=update_fields + ["updated_at"])

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
        *,
        thread_snapshot: str = "",
    ) -> str:
        recent_messages = list(session.messages.order_by("-timestamp")[:8])
        recent_messages.reverse()

        history_lines: List[str] = []
        for message in recent_messages:
            sender = "Student" if message.is_user_message else "Tutor"
            history_lines.append(f"{sender}: {message.message_text[:300]}")

        session_summary = (session.conversation_summary or "").strip()
        previous_context = (session.previous_session_context or "").strip()
        long_term_memory = (thread_snapshot or "").strip()

        mode_instructions = {
            "tutor": "সোক্রেটিক ভঙ্গি: আগে ১টি গাইডিং প্রশ্ন, তারপর ব্যাখ্যা, শেষে ১টি ফলো-আপ প্রশ্ন।",
            "exam": "পরীক্ষা মোড: একবারে ১টি প্রশ্ন করুন, উত্তরের জন্য অপেক্ষা করুন, তারপর সংক্ষিপ্ত মূল্যায়ন+সংশোধন করে পরের প্রশ্ন করুন।",
            "quiz": "কুইজ কোচ: সঠিক/ভুল জানান, ১ লাইনে কারণ, তারপর ১টি ছোট চ্যালেঞ্জ প্রশ্ন দিন।",
            "general": "বন্ধুসুলভ ও সংক্ষিপ্তভাবে শেখান; অপ্রয়োজনীয় লম্বা লেখা নয়।",
        }

        instruction = mode_instructions.get(session.mode, mode_instructions["tutor"])

        return f"""আপনি MedhaBangla-এর Real-time AI Bangla Voice Tutor।

ভাষা নীতি (অবশ্যই মানবেন):
- শুধু স্বাভাবিক, সাবলীল বাংলা ভাষায় কথা বলবেন।
- প্রয়োজন হলে ইংরেজি টার্ম ব্যবহার করতে পারেন, কিন্তু সাথে সাথে বন্ধনীতে সহজ বাংলা ব্যাখ্যা দিন।

শিক্ষকসুলভ আচরণ:
- সহানুভূতিশীল থাকুন, ভুল হলে ভদ্রভাবে ঠিক করে দিন।
- ধাপে ধাপে বুঝিয়ে দিন, এবং শিক্ষার্থীকে ভাবতে সাহায্য করতে প্রশ্ন করুন।
- ভয়েসে শোনার উপযোগী করে ৪-৮ লাইনে উত্তর দিন।
- {instruction}

এক্সাম/ভাইভা নির্দেশনা:
- যদি শিক্ষার্থী "exam"/"viva"/"পরীক্ষা" বলে বা মোড = Exam হয়, তাহলে একবারে ১টি প্রশ্ন করুন।
- শিক্ষার্থীর উত্তরের পরে সংক্ষিপ্ত মূল্যায়ন দিন (ভুল কোথায়), ঠিক উত্তর/ইঙ্গিত দিন, তারপর পরের প্রশ্ন করুন।

শিক্ষার্থী তথ্য:
- নাম: {context.get('student_name', 'Student')}
- শ্রেণি: {context.get('student_class', 9)}
- বিষয়: {session.subject or 'General'}
- টপিক: {session.topic or 'General'}
- দুর্বল দিক: {', '.join(context.get('weak_areas', [])[:3]) or 'এখনও শনাক্ত হয়নি'}
- শক্তিশালী দিক: {', '.join(context.get('strong_areas', [])[:3]) or 'এখনও শনাক্ত হয়নি'}

দীর্ঘমেয়াদি স্মৃতি (থ্রেড সারসংক্ষেপ):
{long_term_memory or 'N/A'}

পূর্ববর্তী সেশন সংক্ষেপ:
{previous_context or 'N/A'}

চলমান সেশন সংক্ষেপ:
{session_summary or 'N/A'}

সাম্প্রতিক কথোপকথন:
{os.linesep.join(history_lines) or 'No prior turns'}

শিক্ষার্থীর বর্তমান ইনপুট:
{user_message}

এখন একটি সংক্ষিপ্ত, ভয়েস-ফ্রেন্ডলি উত্তর দিন এবং শেষে ১টি ফলো-আপ প্রশ্ন করুন।"""

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
        *,
        thread_snapshot: str = "",
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
        prompt = self._build_system_prompt(
            session,
            user_text,
            context,
            thread_snapshot=thread_snapshot,
        )

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

    def _upsert_summary(
        self,
        session: VoiceConversationSession,
        thread: ConversationThread,
        summary_data: Dict,
    ) -> None:
        if not summary_data:
            return

        session.conversation_summary = summary_data.get("summary", "")
        session.key_points = summary_data.get("key_concepts", [])
        session.save(update_fields=["conversation_summary", "key_points", "updated_at"])

        ConversationSummary.objects.update_or_create(
            user=session.user,
            voice_session=session,
            defaults={
                "thread": thread,
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

    def _generate_summary_job(
        self,
        *,
        session_id: int,
        thread_id: int,
        target_message_count: int,
    ) -> None:
        close_old_connections()
        try:
            session = VoiceConversationSession.objects.select_related("user").get(id=session_id)
            thread = ConversationThread.objects.select_related("user_profile").get(id=thread_id)

            metadata = thread.metadata or {}
            last_summary_count = int(metadata.get("last_summary_message_count", 0))
            if last_summary_count >= target_message_count:
                return

            if thread.messages.count() < target_message_count:
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
            if not summary_data:
                return

            self._upsert_summary(session, thread, summary_data)

            memory_snapshot = str(summary_data.get("summary") or "").strip()
            if memory_snapshot:
                thread.memory_snapshot = memory_snapshot

            thread.last_summary_at = timezone.now()
            metadata["last_summary_message_count"] = target_message_count
            thread.metadata = metadata
            thread.save(update_fields=["memory_snapshot", "last_summary_at", "metadata", "updated_at"])

            self._update_profile_from_summary(thread.user_profile, summary_data)
        except Exception:
            logger.exception(
                "Failed to generate incremental summary for thread=%s target_count=%s",
                thread_id,
                target_message_count,
            )
        finally:
            close_old_connections()

    def _schedule_summary_generation(
        self,
        *,
        session_id: int,
        thread_id: int,
        target_message_count: int,
    ) -> None:
        with self._summary_jobs_lock:
            if thread_id in self._summary_jobs:
                return
            self._summary_jobs.add(thread_id)

        def _runner() -> None:
            try:
                async def _job():
                    await asyncio.sleep(0)
                    self._generate_summary_job(
                        session_id=session_id,
                        thread_id=thread_id,
                        target_message_count=target_message_count,
                    )

                asyncio.run(_job())
            except Exception:
                logger.exception("Failed to run async summary task for thread=%s", thread_id)
            finally:
                with self._summary_jobs_lock:
                    self._summary_jobs.discard(thread_id)

        threading.Thread(target=_runner, name=f"voice-summary-{thread_id}", daemon=True).start()

    def maybe_generate_incremental_summary(
        self,
        session: VoiceConversationSession,
        thread: ConversationThread,
    ) -> None:
        total_messages = thread.messages.count()
        if total_messages == 0 or total_messages % 20 != 0:
            return

        metadata = thread.metadata or {}
        last_summary_count = int(metadata.get("last_summary_message_count", 0))
        if total_messages <= last_summary_count:
            return

        self._schedule_summary_generation(
            session_id=session.id,
            thread_id=thread.id,
            target_message_count=total_messages,
        )

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

        thread = self._ensure_thread(session)
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

        user_voice_message = VoiceConversationMessage.objects.create(
            session=session,
            message_text=transcript,
            message_type="question" if session.mode == "tutor" else "quiz_question",
            is_user_message=True,
            transcript=transcript,
        )

        Message.objects.create(
            thread=thread,
            voice_message=user_voice_message,
            role="user",
            content=transcript,
            transcript=transcript,
            provider_trace={
                "stt_provider": stt_provider,
                "stt_fallback_errors": stt_errors,
            },
        )

        thread_snapshot = self._thread_memory_snapshot(thread)

        response_text, llm_provider, llm_errors = self.generate_response(
            session=session,
            user_text=transcript,
            provider_settings=provider_settings,
            thread_snapshot=thread_snapshot,
        )

        if not response_text:
            response_text = (
                "আমি এখনই উত্তর তৈরি করতে পারছি না। একটু পরে আবার চেষ্টা করো।"
            )

        audio_base64, audio_mime_type, tts_provider, tts_errors = self.synthesize_audio(
            response_text,
            provider_settings,
        )

        ai_message = VoiceConversationMessage.objects.create(
            session=session,
            message_text=response_text,
            message_type="answer",
            is_user_message=False,
            ai_response=response_text,
            confidence_score=0.85 if llm_provider else 0.0,
        )

        Message.objects.create(
            thread=thread,
            voice_message=ai_message,
            role="assistant",
            content=response_text,
            provider_trace={
                "llm_provider": llm_provider,
                "tts_provider": tts_provider,
                "llm_fallback_errors": llm_errors,
                "tts_fallback_errors": tts_errors,
            },
        )

        session.total_questions_asked += 1
        session.save(update_fields=["total_questions_asked", "updated_at"])

        self.maybe_generate_incremental_summary(session, thread)

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
