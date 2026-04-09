#!/usr/bin/env python3
import os
import re

files_to_update = [
    'frontend/medhabangla/src/pages/games/ShipFind/index.tsx',
    'frontend/medhabangla/src/pages/games/GamesHub.tsx',
    'frontend/medhabangla/src/pages/games/NumberHunt/index.tsx',
    'frontend/medhabangla/src/pages/games/MemoryPattern/index.tsx'
]

for filepath in files_to_update:
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remove import statement
    content = re.sub(r"import\s+Navbar\s+from\s+['\"].*Navbar['\"];\s*\n", '', content)
    
    # Remove <Navbar /> usage
    content = re.sub(r'\s*<Navbar\s*\/>\s*\n', '\n', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {filepath}")
    else:
        print(f"ℹ️  No changes needed: {filepath}")

print("\n✨ Done!")
