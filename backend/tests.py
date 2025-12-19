"""
Test file to verify the MedhaBangla setup
"""

def test_setup():
    """Test that verifies the basic setup of the MedhaBangla project"""
    # Test that Django is installed
    try:
        import django
        print("✓ Django is installed")
    except ImportError:
        print("✗ Django is not installed")
        return False
    
    # Test that Django REST Framework is installed
    try:
        import rest_framework
        print("✓ Django REST Framework is installed")
    except ImportError:
        print("✗ Django REST Framework is not installed")
        return False
    
    # Test that our apps are available
    try:
        from accounts.models import User
        print("✓ Accounts app is available")
    except ImportError:
        print("✗ Accounts app is not available")
        return False
    
    try:
        from quizzes.models import Quiz
        print("✓ Quizzes app is available")
    except ImportError:
        print("✗ Quizzes app is not available")
        return False
    
    try:
        from books.models import Book
        print("✓ Books app is available")
    except ImportError:
        print("✗ Books app is not available")
        return False
    
    try:
        from games.models import Game
        print("✓ Games app is available")
    except ImportError:
        print("✗ Games app is not available")
        return False
    
    try:
        from ai.models import AIChatSession
        print("✓ AI app is available")
    except ImportError:
        print("✗ AI app is not available")
        return False
    
    print("\n🎉 All tests passed! MedhaBangla setup is working correctly.")
    return True

if __name__ == "__main__":
    test_setup()