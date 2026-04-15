"""WebSocket routing for AI realtime features."""

from django.urls import re_path

from .consumers import AIVoiceTutorConsumer

websocket_urlpatterns = [
    re_path(r"ws/ai/voice-tutor/(?P<session_id>[\w-]+)/$", AIVoiceTutorConsumer.as_asgi()),
]
