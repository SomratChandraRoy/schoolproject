"""
Test script to verify admin endpoints are working
Run with: python test_admin_endpoints.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

def test_admin_endpoints():
    print("🔍 Testing Admin Endpoints...")
    
    # Create or get admin user
    admin_user, created = User.objects.get_or_create(
        username='testadmin@example.com',
        defaults={
            'email': 'testadmin@example.com',
            'is_admin': True,
            'is_staff': True,
            'is_superuser': True,
        }
    )
    
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✅ Created test admin user")
    else:
        print("✅ Using existing admin user")
    
    # Get or create token
    token, _ = Token.objects.get_or_create(user=admin_user)
    print(f"✅ Admin token: {token.key}")
    
    # Create API client
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    
    # Test endpoints
    endpoints = [
        '/api/superuser/accounts/users/',
        '/api/superuser/accounts/users/stats/',
        '/api/superuser/quizzes/quizzes/',
        '/api/superuser/quizzes/quizzes/stats/',
        '/api/superuser/quizzes/subjects/',
        '/api/superuser/books/books/',
        '/api/superuser/books/books/stats/',
        '/api/superuser/books/syllabus/',
        '/api/superuser/books/syllabus/stats/',
    ]
    
    print("\n📡 Testing API Endpoints:")
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {str(e)}")
    
    print("\n✅ Admin endpoint testing complete!")
    print(f"\n📝 Admin credentials:")
    print(f"   Email: testadmin@example.com")
    print(f"   Password: admin123")
    print(f"   Token: {token.key}")
    print(f"\n🌐 Access dashboard at: http://localhost:5173/superuser")

if __name__ == '__main__':
    test_admin_endpoints()
