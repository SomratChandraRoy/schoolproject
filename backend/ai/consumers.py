"""WebSocket consumer for real-time AI Bangla voice tutor."""

import base64
import json
import logging

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone
from rest_framework.authtoken.models import Token

from .models import VoiceConversationSession
from .realtime_voice_pipeline import get_realtime_voice_pipeline

logger = logging.getLogger(__name__)


class AIVoiceTutorConsumer(AsyncWebsocketConsumer):
    """
    Duplex voice channel.

    Client events:
    - audio_chunk {chunk_base64, mime_type}
    - audio_commit {audio_base64?, mime_type?}
    - text_message {text}
    - end_session {}
    - ping {}
    """

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"].get("session_id")
        self.audio_mime_type = "audio/webm"
        self.audio_buffer = bytearray()
        self.pipeline = get_realtime_voice_pipeline()

        self.user = await self._get_user_from_token()
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        has_access = await self._session_belongs_to_user(self.session_id, self.user.id)
        if not has_access:
            await self.close(code=4403)
            return

        await self.accept()
        await self.send_json(
            {
                "type": "connection_established",
                "session_id": self.session_id,
                "message": "Real-time voice tutor connected",
            }
        )
        await self._send_status("listening")

    async def disconnect(self, close_code):
        self.audio_buffer.clear()

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self._send_error("Invalid JSON payload")
            return

        event_type = payload.get("type")

        if event_type == "ping":
            await self.send_json({"type": "pong"})
            return

        if event_type == "audio_chunk":
            await self._handle_audio_chunk(payload)
            return

        if event_type == "audio_commit":
            await self._handle_audio_commit(payload)
            return

        if event_type == "text_message":
            await self._handle_text_message((payload.get("text") or "").strip())
            return

        if event_type == "end_session":
            await self._end_session()
            await self.send_json({"type": "session_ended", "session_id": self.session_id})
            await self.close(code=1000)
            return

        await self._send_error("Unsupported event type")

    async def _handle_audio_chunk(self, payload: dict):
        chunk_base64 = payload.get("chunk_base64")
        if not chunk_base64:
            await self._send_error("Missing chunk_base64")
            return

        mime_type = payload.get("mime_type")
        if mime_type:
            self.audio_mime_type = mime_type

        try:
            self.audio_buffer.extend(base64.b64decode(chunk_base64))
        except Exception:
            await self._send_error("Invalid audio chunk encoding")
            return

        await self.send_json(
            {
                "type": "audio_chunk_ack",
                "buffered_bytes": len(self.audio_buffer),
            }
        )

    def _min_voice_payload_bytes(self) -> int:
        """
        Determine minimal payload size by MIME type.

        Compressed browser formats (webm/mp4/aac/mpeg) can be very small even for
        clear short utterances, so keep threshold low to avoid false negatives.
        """
        mime = (self.audio_mime_type or "").lower()

        if any(token in mime for token in ("webm", "mp4", "aac", "mpeg", "mp3")):
            return 120

        if any(token in mime for token in ("wav", "pcm", "l16", "raw")):
            return 640

        return 160

    async def _handle_audio_commit(self, payload: dict):
        inline_audio_base64 = payload.get("audio_base64")
        mime_type = payload.get("mime_type")
        if mime_type:
            self.audio_mime_type = str(mime_type)

        audio_bytes = None

        if inline_audio_base64:
            try:
                audio_bytes = base64.b64decode(inline_audio_base64)
                self.audio_buffer.clear()
            except Exception:
                await self._send_error("Invalid audio_commit payload encoding")
                return

        if audio_bytes is None:
            if not self.audio_buffer:
                await self._send_error("No buffered audio to process")
                return

            audio_bytes = bytes(self.audio_buffer)
            self.audio_buffer.clear()

        min_payload = self._min_voice_payload_bytes()
        if len(audio_bytes) < min_payload:
            logger.info(
                "Dropping too-short voice payload session=%s mime=%s bytes=%s threshold=%s",
                self.session_id,
                self.audio_mime_type,
                len(audio_bytes),
                min_payload,
            )
            await self._send_error("Voice input too short. Please speak a little longer.")
            await self._send_status("listening")
            return

        await self._send_status("thinking")

        try:
            result = await sync_to_async(self.pipeline.process_turn, thread_sensitive=False)(
                session_id=self.session_id,
                user_id=self.user.id,
                audio_bytes=audio_bytes,
                audio_mime_type=self.audio_mime_type,
            )
        except Exception as exc:
            logger.exception("Voice turn processing failed")
            await self._send_error(str(exc))
            await self._send_status("listening")
            return

        await self.send_json(
            {
                "type": "user_transcript",
                "text": result.get("transcript", ""),
                "session_id": self.session_id,
            }
        )

        await self.send_json(
            {
                "type": "assistant_response",
                "text": result.get("response_text", ""),
                "audio_base64": result.get("audio_base64"),
                "audio_mime_type": result.get("audio_mime_type"),
                "providers": result.get("providers", {}),
                "fallback_errors": result.get("fallback_errors", {}),
                "mode": result.get("mode"),
                "message_id": result.get("ai_message_id"),
            }
        )

        if result.get("audio_base64"):
            await self._send_status("speaking")
        else:
            await self._send_status("listening")

    async def _handle_text_message(self, text: str):
        if not text:
            await self._send_error("Text message cannot be empty")
            return

        await self._send_status("thinking")

        try:
            result = await sync_to_async(self.pipeline.process_turn, thread_sensitive=False)(
                session_id=self.session_id,
                user_id=self.user.id,
                text_message=text,
            )
        except Exception as exc:
            logger.exception("Text turn processing failed")
            await self._send_error(str(exc))
            await self._send_status("listening")
            return

        await self.send_json(
            {
                "type": "assistant_response",
                "text": result.get("response_text", ""),
                "audio_base64": result.get("audio_base64"),
                "audio_mime_type": result.get("audio_mime_type"),
                "providers": result.get("providers", {}),
                "fallback_errors": result.get("fallback_errors", {}),
                "mode": result.get("mode"),
                "message_id": result.get("ai_message_id"),
            }
        )

        if result.get("audio_base64"):
            await self._send_status("speaking")
        else:
            await self._send_status("listening")

    async def _send_status(self, state: str):
        await self.send_json(
            {
                "type": "state",
                "state": state,
                "session_id": self.session_id,
            }
        )

    async def _send_error(self, message: str):
        await self.send_json({"type": "error", "message": message})

    @database_sync_to_async
    def _get_user_from_token(self):
        try:
            query_string = self.scope.get("query_string", b"").decode()
            params = dict(param.split("=", 1) for param in query_string.split("&") if "=" in param)
            token_key = params.get("token")
            if not token_key:
                return None

            token = Token.objects.select_related("user").get(key=token_key)
            return token.user
        except Exception:
            return None

    @database_sync_to_async
    def _session_belongs_to_user(self, session_id: str, user_id: int) -> bool:
        return VoiceConversationSession.objects.filter(
            session_id=session_id,
            user_id=user_id,
            is_active=True,
        ).exists()

    @database_sync_to_async
    def _end_session(self):
        VoiceConversationSession.objects.filter(
            session_id=self.session_id,
            user_id=self.user.id,
            is_active=True,
        ).update(is_active=False, ended_at=timezone.now())

    async def send_json(self, payload: dict):
        await self.send(text_data=json.dumps(payload))
