import os

app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

import_statement = 'import DocumentAnalysis from "./pages/DocumentAnalysis";\n'
if import_statement not in content:
    content = content.replace(
        'import VoiceTutor from "./pages/VoiceTutor";\n',
        'import VoiceTutor from "./pages/VoiceTutor";\n' + import_statement
    )

route_statement = '          <Route path="/document-vision" element={<DocumentAnalysis />} />\n'
if '<Route path="/document-vision"' not in content:
    content = content.replace(
        '          <Route path="/voice-tutor" element={<VoiceTutor />} />\n',
        '          <Route path="/voice-tutor" element={<VoiceTutor />} />\n' + route_statement
    )

with open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx updated for DocumentVision route.")
