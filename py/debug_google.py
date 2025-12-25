import sys
import os

print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Sys path: {sys.path}")

try:
    import google
    print(f"Google package: {google}")
    print(f"Google path: {google.__path__}")
except ImportError as e:
    print(f"Failed to import google: {e}")

try:
    from google import genai
    print(f"Genai package: {genai}")
    print(f"Genai file: {genai.__file__}")
except ImportError as e:
    print(f"Failed to import genai from google: {e}")

try:
    import google.genai
    print(f"Direct import google.genai: {google.genai}")
except ImportError as e:
    print(f"Failed to direct import google.genai: {e}")
