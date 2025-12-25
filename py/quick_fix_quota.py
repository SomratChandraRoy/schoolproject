"""
Quick Fix for Gemini API Quota Issue
This script switches the model from gemini-2.5-flash to gemini-1.5-flash
which has a different quota pool (1,500 requests/day vs 20 requests/day)
"""
import os
import re

def switch_to_gemini_15_flash():
    """Switch all Gemini API calls to use gemini-1.5-flash"""
    
    print("=" * 70)
    print("Quick Fix: Switching to gemini-1.5-flash")
    print("=" * 70)
    print()
    
    # File to update
    views_file = 'ai/views.py'
    
    if not os.path.exists(views_file):
        print(f"❌ ERROR: {views_file} not found")
        return False
    
    # Read the file
    with open(views_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count occurrences
    count_25 = content.count("'gemini-2.5-flash'")
    count_15 = content.count("'gemini-1.5-flash'")
    
    print(f"Current status:")
    print(f"  - gemini-2.5-flash: {count_25} occurrences")
    print(f"  - gemini-1.5-flash: {count_15} occurrences")
    print()
    
    if count_25 == 0:
        print("✓ Already using gemini-1.5-flash or different model")
        return True
    
    # Replace all occurrences
    new_content = content.replace("'gemini-2.5-flash'", "'gemini-1.5-flash'")
    
    # Write back
    with open(views_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ SUCCESS: Replaced {count_25} occurrences")
    print()
    print("Changes made:")
    print(f"  - {views_file}: gemini-2.5-flash → gemini-1.5-flash")
    print()
    print("=" * 70)
    print("Next Steps:")
    print("=" * 70)
    print("1. Restart your Django server")
    print("2. Test the API: python test_gemini_api.py")
    print("3. Try generating a question in the UI")
    print()
    print("Note: gemini-1.5-flash has higher quota (1,500/day)")
    print("=" * 70)
    
    return True

def revert_to_gemini_25_flash():
    """Revert back to gemini-2.5-flash"""
    
    print("=" * 70)
    print("Reverting to gemini-2.5-flash")
    print("=" * 70)
    print()
    
    views_file = 'ai/views.py'
    
    if not os.path.exists(views_file):
        print(f"❌ ERROR: {views_file} not found")
        return False
    
    with open(views_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    count = content.count("'gemini-1.5-flash'")
    
    if count == 0:
        print("✓ Already using gemini-2.5-flash")
        return True
    
    new_content = content.replace("'gemini-1.5-flash'", "'gemini-2.5-flash'")
    
    with open(views_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ SUCCESS: Reverted {count} occurrences")
    print()
    
    return True

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'revert':
        revert_to_gemini_25_flash()
    else:
        switch_to_gemini_15_flash()
