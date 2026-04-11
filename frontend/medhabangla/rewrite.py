import sys
try:
    with open('src/App.tsx', 'r') as f:
        src = f.read()

    src = src.replace('import TldrawPage from "./pages/Tldraw";', 'import TldrawPage from "./pages/Tldraw";\nimport AcademicsDashboard from "./pages/AcademicsDashboard";')
    src = src.replace('<Route path="/drawing" element={<TldrawPage />} />', '<Route path="/drawing" element={<TldrawPage />} />\n                <Route path="/academics" element={<AcademicsDashboard />} />')

    with open('src/App.tsx', 'w') as f:
        f.write(src)
    print('Replaced')
except Exception as e:
    print(e)