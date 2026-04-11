import os

app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
import_statement = 'import StudyPlan from "./pages/StudyPlan";\n'
if import_statement not in content:
    content = content.replace(
        'import AcademicsDashboard from "./pages/AcademicsDashboard";\n',
        'import AcademicsDashboard from "./pages/AcademicsDashboard";\n' + import_statement
    )

# Add route
route_statement = '          <Route path="/study-plan" element={<StudyPlan />} />\n'
if '<Route path="/study-plan" element={<StudyPlan />} />' not in content:
    content = content.replace(
        '          <Route path="/academics" element={<AcademicsDashboard />} />\n',
        '          <Route path="/academics" element={<AcademicsDashboard />} />\n' + route_statement
    )

# Add nav link into sidebar logic - wait, App.tsx should just have the route. Sidebar comes from Navbar.tsx probably.
with open(app_tsx_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx updated for StudyPlan route.")
