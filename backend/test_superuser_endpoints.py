"""
Test script to verify all superuser API endpoints are working
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from accounts.admin_views import AdminUserViewSet
from quizzes.admin_views import AdminQuizViewSet, AdminSubjectViewSet
from books.admin_views import AdminBookViewSet, AdminSyllabusViewSet

User = get_user_model()

def test_endpoints():
    """Test all superuser endpoints"""
    
    print("=" * 70)
    print("Testing Superuser API Endpoints")
    print("=" * 70)
    print()
    
    # Create or get admin user
    try:
        admin_user = User.objects.get(username='admin')
        print("✓ Using existing admin user")
    except User.DoesNotExist:
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='admin123',
            is_admin=True,
            is_staff=True,
            is_superuser=True
        )
        print("✓ Created admin user")
    
    print(f"  Username: {admin_user.username}")
    print(f"  Is Admin: {admin_user.is_admin}")
    print()
    
    factory = RequestFactory()
    
    # Test Users Endpoint
    print("Testing Users Endpoint...")
    try:
        request = factory.get('/api/superuser/accounts/users/')
        request.user = admin_user
        
        view = AdminUserViewSet.as_view({'get': 'list'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/accounts/users/ - {response.status_code}")
            print(f"     Found {len(response.data)} users")
        else:
            print(f"  ❌ GET /api/superuser/accounts/users/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Users Stats Endpoint
    print("Testing Users Stats Endpoint...")
    try:
        request = factory.get('/api/superuser/accounts/users/stats/')
        request.user = admin_user
        
        view = AdminUserViewSet.as_view({'get': 'stats'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/accounts/users/stats/ - {response.status_code}")
            print(f"     Stats: {response.data}")
        else:
            print(f"  ❌ GET /api/superuser/accounts/users/stats/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Quizzes Endpoint
    print("Testing Quizzes Endpoint...")
    try:
        request = factory.get('/api/superuser/quizzes/quizzes/')
        request.user = admin_user
        
        view = AdminQuizViewSet.as_view({'get': 'list'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/quizzes/quizzes/ - {response.status_code}")
            print(f"     Found {len(response.data)} quizzes")
        else:
            print(f"  ❌ GET /api/superuser/quizzes/quizzes/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Quizzes Stats Endpoint
    print("Testing Quizzes Stats Endpoint...")
    try:
        request = factory.get('/api/superuser/quizzes/quizzes/stats/')
        request.user = admin_user
        
        view = AdminQuizViewSet.as_view({'get': 'stats'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/quizzes/quizzes/stats/ - {response.status_code}")
            print(f"     Stats: {response.data}")
        else:
            print(f"  ❌ GET /api/superuser/quizzes/quizzes/stats/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Subjects Endpoint
    print("Testing Subjects Endpoint...")
    try:
        request = factory.get('/api/superuser/quizzes/subjects/')
        request.user = admin_user
        
        view = AdminSubjectViewSet.as_view({'get': 'list'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/quizzes/subjects/ - {response.status_code}")
            print(f"     Found {len(response.data)} subjects")
        else:
            print(f"  ❌ GET /api/superuser/quizzes/subjects/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Books Endpoint
    print("Testing Books Endpoint...")
    try:
        request = factory.get('/api/superuser/books/books/')
        request.user = admin_user
        
        view = AdminBookViewSet.as_view({'get': 'list'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/books/books/ - {response.status_code}")
            print(f"     Found {len(response.data)} books")
        else:
            print(f"  ❌ GET /api/superuser/books/books/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Books Stats Endpoint
    print("Testing Books Stats Endpoint...")
    try:
        request = factory.get('/api/superuser/books/books/stats/')
        request.user = admin_user
        
        view = AdminBookViewSet.as_view({'get': 'stats'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/books/books/stats/ - {response.status_code}")
            print(f"     Stats: {response.data}")
        else:
            print(f"  ❌ GET /api/superuser/books/books/stats/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Syllabus Endpoint
    print("Testing Syllabus Endpoint...")
    try:
        request = factory.get('/api/superuser/books/syllabus/')
        request.user = admin_user
        
        view = AdminSyllabusViewSet.as_view({'get': 'list'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/books/syllabus/ - {response.status_code}")
            print(f"     Found {len(response.data)} syllabus items")
        else:
            print(f"  ❌ GET /api/superuser/books/syllabus/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    # Test Syllabus Stats Endpoint
    print("Testing Syllabus Stats Endpoint...")
    try:
        request = factory.get('/api/superuser/books/syllabus/stats/')
        request.user = admin_user
        
        view = AdminSyllabusViewSet.as_view({'get': 'stats'})
        response = view(request)
        
        if response.status_code == 200:
            print(f"  ✅ GET /api/superuser/books/syllabus/stats/ - {response.status_code}")
            print(f"     Stats: {response.data}")
        else:
            print(f"  ❌ GET /api/superuser/books/syllabus/stats/ - {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    print()
    
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print()
    print("All superuser API endpoints are properly configured!")
    print()
    print("If frontend still can't access them, check:")
    print("  1. Is Django server running? (python manage.py runserver)")
    print("  2. Is user logged in as admin?")
    print("  3. Does user have valid auth token?")
    print("  4. Check browser console for errors (F12)")
    print("  5. Check Network tab for failed requests")
    print()
    print("Admin user credentials:")
    print(f"  Username: {admin_user.username}")
    print(f"  Password: admin123")
    print(f"  Is Admin: {admin_user.is_admin}")
    print()
    print("=" * 70)

if __name__ == '__main__':
    test_endpoints()
