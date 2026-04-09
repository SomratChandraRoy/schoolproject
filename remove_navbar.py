#!/usr/bin/env python3
"""
Script to remove Navbar imports and usage from all page files
"""

import os
import re

# List of files to update
files_to_update = [
    'frontend/medhabangla/src/pages/Quiz.tsx',
    'frontend/medhabangla/src/pages/StudyTimer.tsx',
    'frontend/medhabangla/src/pages/QuizManagement.tsx',
    'frontend/medhabangla/src/pages/SuperuserDashboard.tsx',
    'frontend/medhabangla/src/pages/NotesEnhanced.tsx',
    'frontend/medhabangla/src/pages/StudyStats.tsx',
    'frontend/medhabangla/src/pages/Tldraw.tsx',
    'frontend/medhabangla/src/pages/Register.tsx',
    'frontend/medhabangla/src/pages/Profile.tsx',
    'frontend/medhabangla/src/pages/NotesFileSystem.tsx',
    'frontend/medhabangla/src/pages/Syllabus.tsx',
    'frontend/medhabangla/src/pages/QuizSelection.tsx',
    'frontend/medhabangla/src/pages/Leaderboard.tsx',
    'frontend/medhabangla/src/pages/Games.tsx',
    'frontend/medhabangla/src/pages/Login.tsx',
    'frontend/medhabangla/src/pages/Home.tsx',
    'frontend/medhabangla/src/pages/Books.tsx',
    'frontend/medhabangla/src/pages/Chat.tsx',
    'frontend/medhabangla/src/pages/Notes.tsx',
    'frontend/medhabangla/src/pages/Dashboard.tsx',
    'frontend/medhabangla/src/pages/AdminSettings.tsx',
    'frontend/medhabangla/src/pages/AdaptiveQuiz.tsx',
    'frontend/medhabangla/src/pages/AdminDashboard.tsx',
]

def remove_navbar_from_file(filepath):
    """Remove Navbar import and usage from a file"""
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Remove import statement
    content = re.sub(r"import\s+Navbar\s+from\s+['\"]\.\.\/components\/Navbar['\"];\s*\n", '', content)
    
    # Remove <Navbar /> usage (with optional whitespace)
    content = re.sub(r'\s*<Navbar\s*\/>\s*\n', '\n', content)
    
    # If content changed, write it back
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {filepath}")
        return True
    else:
        print(f"ℹ️  No changes needed: {filepath}")
        return False

def main():
    print("🚀 Starting Navbar removal process...\n")
    
    updated_count = 0
    for filepath in files_to_update:
        if remove_navbar_from_file(filepath):
            updated_count += 1
    
    print(f"\n✨ Done! Updated {updated_count} files.")

if __name__ == '__main__':
    main()
