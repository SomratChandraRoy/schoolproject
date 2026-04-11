import os

app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

import_statement = 'import Flashcards from "./pages/Flashcards";\n'
if import_statement not in content:
    content = content.replace(
        'import DocumentAnalysis from "./pages/DocumentAnalysis";\n',
        'import DocumentAnalysis from "./pages/DocumentAnalysis";\n' + import_statement
    )

route_statement = '          <Route path="/flashcards" element={<Flashcards />} />\n'
if '<Route path="/flashcards"' not in content:
    content = content.replace(
        '          <Route path="/document-vision" element={<DocumentAnalysis />} />\n',
        '          <Route path="/document-vision" element={<DocumentAnalysis />} />\n' + route_statement
    )

with open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx updated for Flashcards route.")
