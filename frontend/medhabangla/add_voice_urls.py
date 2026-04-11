import os

urls_path = "../../backend/ai/urls.py"
with open(urls_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
import_statement = "from .voice_views import VoiceTutorView\n"
if "from .voice_views import VoiceTutorView" not in content:
    content = content.replace("from .admin_views import", import_statement + "from .admin_views import")

# Add route
route_statement = "    path('voice-tutor/', VoiceTutorView.as_view(), name='voice-tutor'),\n"
if "path('voice-tutor/'" not in content:
    content = content.replace("urlpatterns = [", "urlpatterns = [\n" + route_statement)

with open(urls_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added Voice Tutor to urls.py")
