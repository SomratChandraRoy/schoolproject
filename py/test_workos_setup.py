#!/usr/bin/env python
"""
Test script to verify WorkOS configuration and connectivity.
Run this script to check if WorkOS is properly configured.

Usage:
    python test_workos_setup.py
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_environment_variables():
    """Test if all required environment variables are set"""
    print("=" * 60)
    print("Testing Environment Variables")
    print("=" * 60)
    
    required_vars = {
        'WORKOS_API_KEY': os.getenv('WORKOS_API_KEY'),
        'WORKOS_CLIENT_ID': os.getenv('WORKOS_CLIENT_ID'),
        'WORKOS_REDIRECT_URI': os.getenv('WORKOS_REDIRECT_URI'),
    }
    
    all_set = True
    for var_name, var_value in required_vars.items():
        if var_value:
            # Mask the API key for security
            if 'API_KEY' in var_name:
                display_value = var_value[:20] + '...' + var_value[-10:]
            else:
                display_value = var_value
            print(f"✓ {var_name}: {display_value}")
        else:
            print(f"✗ {var_name}: NOT SET")
            all_set = False
    
    print()
    return all_set

def test_workos_import():
    """Test if WorkOS SDK is installed"""
    print("=" * 60)
    print("Testing WorkOS SDK Installation")
    print("=" * 60)
    
    try:
        from workos import WorkOSClient
        print("✓ WorkOS SDK is installed")
        print()
        return True
    except ImportError as e:
        print(f"✗ WorkOS SDK is NOT installed: {e}")
        print("  Install it with: pip install workos")
        print()
        return False

def test_workos_client():
    """Test if WorkOS client can be initialized"""
    print("=" * 60)
    print("Testing WorkOS Client Initialization")
    print("=" * 60)
    
    try:
        from workos import WorkOSClient
        
        api_key = os.getenv('WORKOS_API_KEY')
        client_id = os.getenv('WORKOS_CLIENT_ID')
        
        if not api_key or not client_id:
            print("✗ Cannot initialize client: Missing credentials")
            print()
            return False
        
        workos = WorkOSClient(
            api_key=api_key,
            client_id=client_id
        )
        
        print("✓ WorkOS client initialized successfully")
        print()
        return True
    except Exception as e:
        print(f"✗ Failed to initialize WorkOS client: {e}")
        print()
        return False

def test_authorization_url():
    """Test if authorization URL can be generated"""
    print("=" * 60)
    print("Testing Authorization URL Generation")
    print("=" * 60)
    
    try:
        from workos import WorkOSClient
        
        api_key = os.getenv('WORKOS_API_KEY')
        client_id = os.getenv('WORKOS_CLIENT_ID')
        redirect_uri = os.getenv('WORKOS_REDIRECT_URI')
        
        workos = WorkOSClient(
            api_key=api_key,
            client_id=client_id
        )
        
        # Try to generate authorization URL
        authorization_url = workos.user_management.get_authorization_url(
            provider='authkit',
            redirect_uri=redirect_uri,
            client_id=client_id
        )
        
        print("✓ Authorization URL generated successfully")
        print(f"  URL: {authorization_url[:80]}...")
        print()
        return True
    except Exception as e:
        print(f"✗ Failed to generate authorization URL: {e}")
        print()
        print("IMPORTANT: This error might indicate:")
        print("  1. Google OAuth connection is not configured in WorkOS dashboard")
        print("  2. The connection is disabled")
        print("  3. Invalid API credentials")
        print()
        print("Next steps:")
        print("  1. Login to WorkOS dashboard: https://dashboard.workos.com")
        print("  2. Go to Authentication > Connections")
        print("  3. Add/Enable Google OAuth connection")
        print("  4. Configure Google Client ID and Secret")
        print()
        return False

def main():
    """Run all tests"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 15 + "WorkOS Setup Test" + " " * 25 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    results = []
    
    # Run tests
    results.append(("Environment Variables", test_environment_variables()))
    results.append(("WorkOS SDK Installation", test_workos_import()))
    results.append(("WorkOS Client Initialization", test_workos_client()))
    results.append(("Authorization URL Generation", test_authorization_url()))
    
    # Print summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    print()
    
    if passed == total:
        print("🎉 All tests passed! WorkOS is properly configured.")
        print()
        print("Next steps:")
        print("  1. Start the backend: python manage.py runserver")
        print("  2. Start the frontend: cd frontend/medhabangla && npm run dev")
        print("  3. Test Google login at: http://localhost:5173/login")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
        print()
        print("For detailed setup instructions, see:")
        print("  - WORKOS_SETUP_GUIDE.md")
        print("  - https://workos.com/docs")
    
    print()
    return 0 if passed == total else 1

if __name__ == '__main__':
    sys.exit(main())
