import os

app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

import_statement = 'import VoiceTutor from "./pages/VoiceTutor";\n'
if import_statement not in content:
    content = content.replace(
        'import StudyPlan from "./pages/StudyPlan";\n',
        'import StudyPlan from "./pages/StudyPlan";\n' + import_statement
    )

route_statement = '          <Route path="/voice-tutor" element={<VoiceTutor />} />\n'
if '<Route path="/voice-tutor"' not in content:
    content = content.replace(
        '          <Route path="/study-plan" element={<StudyPlan />} />\n',
        '          <Route path="/study-plan" element={<StudyPlan />} />\n' + route_statement
    )

with open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx updated for VoiceTutor route.")
