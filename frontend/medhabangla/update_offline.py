import os

app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

import_statement = "import OfflineIndicator from './components/OfflineIndicator';\n"
if "OfflineIndicator" not in content:
    content = content.replace("import Auth from", import_statement + "\nimport Auth from")
    
    # insert above </Router>
    content = content.replace("    </Router>", "      <OfflineIndicator />\n    </Router>")

    with open(app_tsx_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("App.tsx updated with OfflineIndicator")
else:
    print("OfflineIndicator already in App.tsx")
