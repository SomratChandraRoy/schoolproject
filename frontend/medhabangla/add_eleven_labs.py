import os

models_path = "../../backend/ai/models.py"
with open(models_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's see if we need to add elevenlabs_api_key
if "elevenlabs_api_key" not in content:
    content = content.replace("class AIProviderSettings(models.Model):", "class AIProviderSettings(models.Model):\n    elevenlabs_api_key = models.CharField(max_length=255, blank=True, null=True, help_text='API Key for ElevenLabs Voice Synthesis (leave blank to use browser native voice)')")
    with open(models_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Added elevenlabs_api_key to models.py")
else:
    print("elevenlabs_api_key already exists")
