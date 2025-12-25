"""
Test script to verify superuser dashboard data is accessible
Run with: python test_superuser_ui.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User
from quizzes.models import Quiz, Subject
from books.models import Book, Syllabus
from rest_framework.authtoken.models import Token

def test_superuser_data():
    print("🔍 Testing Superuser Dashboard Data Availability...")
    
    # Get or create admin user
    admin_user = User.objects.filter(is_admin=True).first()
    if not admin_user:
        print("❌ No admin user found. Creating one...")
        admin_user = User.objects.create_user(
            username='admin@test.com',
            email='admin@test.com',
            password='admin123',
            is_admin=True,
            is_staff=True
        )
        print("✅ Admin user created")
    else:
        print(f"✅ Found admin user: {admin_user.email}")
    
    # Get token
    token, _ = Token.objects.get_or_create(user=admin_user)
    print(f"✅ Admin token: {token.key}")
    
    # Check data counts
    print("\n📊 Data Counts:")
    print(f"   Users: {User.objects.count()}")
    print(f"   Students: {User.objects.filter(is_student=True).count()}")
    print(f"   Teachers: {User.objects.filter(is_teacher=True).count()}")
    print(f"   Admins: {User.objects.filter(is_admin=True).count()}")
    print(f"   Quizzes: {Quiz.objects.count()}")
    print(f"   Subjects: {Subject.objects.count()}")
    print(f"   Books: {Book.objects.count()}")
    print(f"   Syllabus Chapters: {Syllabus.objects.count()}")
    
    # Check if we have data
    has_data = (
        User.objects.count() > 0 and
        Subject.objects.count() > 0
    )
    
    if not has_data:
        print("\n⚠️  Warning: Some tables are empty!")
        print("   Run these commands to populate data:")
        print("   - python manage.py populate_subjects")
        print("   - python manage.py populate_all_questions")
    else:
        print("\n✅ All tables have data!")
    
    print("\n🌐 Access superuser dashboard:")
    print(f"   URL: http://localhost:5173/superuser")
    print(f"   Email: {admin_user.email}")
    print(f"   Password: admin123")
    print(f"   Token: {token.key}")
    
    print("\n📝 Test API endpoints:")
    print(f"   curl http://localhost:8000/api/superuser/accounts/users/stats/ \\")
    print(f"     -H 'Authorization: Token {token.key}'")

if __name__ == '__main__':
    test_superuser_data()
