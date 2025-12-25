"""
Debug script to see what data the API is actually returning
"""
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.test import RequestFactory
from accounts.models import User
from accounts.admin_views import AdminUserViewSet
from quizzes.admin_views import AdminQuizViewSet, AdminSubjectViewSet
from books.admin_views import AdminBookViewSet, AdminSyllabusViewSet

def debug_api():
    """Debug API responses"""
    
    print("=" * 70)
    print("Debugging Superuser API Responses")
    print("=" * 70)
    print()
    
    # Get admin user
    admin_user = User.objects.get(username='admin')
    factory = RequestFactory()
    
    # Test Users
    print("1. USERS ENDPOINT")
    print("-" * 70)
    request = factory.get('/api/superuser/accounts/users/')
    request.user = admin_user
    view = AdminUserViewSet.as_view({'get': 'list'})
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Data type: {type(response.data)}")
    print(f"Data length: {len(response.data) if isinstance(response.data, list) else 'N/A'}")
    
    if response.data:
        print("\nFirst item structure:")
        first_item = response.data[0] if isinstance(response.data, list) else response.data
        print(json.dumps(first_item, indent=2, default=str))
    print()
    
    # Test Quizzes
    print("2. QUIZZES ENDPOINT")
    print("-" * 70)
    request = factory.get('/api/superuser/quizzes/quizzes/')
    request.user = admin_user
    view = AdminQuizViewSet.as_view({'get': 'list'})
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Data type: {type(response.data)}")
    
    # Check if paginated
    if isinstance(response.data, dict) and 'results' in response.data:
        print("⚠️  PAGINATED RESPONSE!")
        print(f"Count: {response.data.get('count')}")
        print(f"Results length: {len(response.data.get('results', []))}")
        if response.data.get('results'):
            print("\nFirst item structure:")
            print(json.dumps(response.data['results'][0], indent=2, default=str))
    elif isinstance(response.data, list):
        print(f"Data length: {len(response.data)}")
        if response.data:
            print("\nFirst item structure:")
            print(json.dumps(response.data[0], indent=2, default=str))
    print()
    
    # Test Subjects
    print("3. SUBJECTS ENDPOINT")
    print("-" * 70)
    request = factory.get('/api/superuser/quizzes/subjects/')
    request.user = admin_user
    view = AdminSubjectViewSet.as_view({'get': 'list'})
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Data type: {type(response.data)}")
    
    if isinstance(response.data, dict) and 'results' in response.data:
        print("⚠️  PAGINATED RESPONSE!")
        print(f"Count: {response.data.get('count')}")
        print(f"Results length: {len(response.data.get('results', []))}")
    elif isinstance(response.data, list):
        print(f"Data length: {len(response.data)}")
    print()
    
    # Test Books
    print("4. BOOKS ENDPOINT")
    print("-" * 70)
    request = factory.get('/api/superuser/books/books/')
    request.user = admin_user
    view = AdminBookViewSet.as_view({'get': 'list'})
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Data type: {type(response.data)}")
    
    if isinstance(response.data, dict) and 'results' in response.data:
        print("⚠️  PAGINATED RESPONSE!")
        print(f"Count: {response.data.get('count')}")
        print(f"Results length: {len(response.data.get('results', []))}")
    elif isinstance(response.data, list):
        print(f"Data length: {len(response.data)}")
    print()
    
    # Test Syllabus
    print("5. SYLLABUS ENDPOINT")
    print("-" * 70)
    request = factory.get('/api/superuser/books/syllabus/')
    request.user = admin_user
    view = AdminSyllabusViewSet.as_view({'get': 'list'})
    response = view(request)
    
    print(f"Status: {response.status_code}")
    print(f"Data type: {type(response.data)}")
    
    if isinstance(response.data, dict) and 'results' in response.data:
        print("⚠️  PAGINATED RESPONSE!")
        print(f"Count: {response.data.get('count')}")
        print(f"Results length: {len(response.data.get('results', []))}")
    elif isinstance(response.data, list):
        print(f"Data length: {len(response.data)}")
    print()
    
    print("=" * 70)
    print("DIAGNOSIS")
    print("=" * 70)
    print()
    print("If you see 'PAGINATED RESPONSE', the frontend needs to handle")
    print("pagination by accessing response.data.results instead of response.data")
    print()
    print("=" * 70)

if __name__ == '__main__':
    debug_api()
