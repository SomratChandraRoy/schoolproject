import os

app_tsx_path = "src/App.tsx"
with open(app_tsx_path, "r", encoding="utf-8") as f:
    content = f.read()

import_statement = "import OfflineIndicator from './components/OfflineIndicator';\n"
if "import OfflineIndicator" not in content:
    content = content.replace('import * as React from "react";', 'import * as React from "react";\n' + import_statement)
    
    if "<OfflineIndicator" not in content:
        content = content.replace("</Routes>", "</Routes>\n        <OfflineIndicator />")

    with open(app_tsx_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed App.tsx")
