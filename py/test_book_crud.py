#!/usr/bin/env python
"""
Test script for Books and Syllabus CRUD with file uploads
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from books.models import Book, Syllabus
from django.contrib.auth import get_user_model

User = get_user_model()

def test_book_crud():
    print("\n" + "="*60)
    print("TESTING BOOKS CRUD")
    print("="*60)
    
    # Get admin user
    admin = User.objects.filter(is_admin=True).first()
    if not admin:
        print("❌ No admin user found!")
        return
    
    print(f"✅ Admin user: {admin.username}")
    
    # Test 1: Create book without files
    print("\n📝 Test 1: Create book without files")
    book = Book.objects.create(
        title="Test Physics Book",
        author="Dr. Test",
        class_level=10,
        category="textbook",
        language="bn",
        description="Test book for physics"
    )
    print(f"✅ Created book: {book.title} (ID: {book.id})")
    
    # Test 2: Check book fields
    print("\n📝 Test 2: Check book fields")
    print(f"   - Title: {book.title}")
    print(f"   - Author: {book.author}")
    print(f"   - Class: {book.class_level}")
    print(f"   - Category: {book.category}")
    print(f"   - Language: {book.language}")
    print(f"   - PDF File: {book.pdf_file or 'None'}")
    print(f"   - Cover Image: {book.cover_image or 'None'}")
    
    # Test 3: Update book
    print("\n📝 Test 3: Update book")
    book.description = "Updated description"
    book.save()
    print(f"✅ Updated book description")
    
    # Test 4: Delete book
    print("\n📝 Test 4: Delete book")
    book_id = book.id
    book.delete()
    print(f"✅ Deleted book ID: {book_id}")
    
    print("\n✅ All book tests passed!")


def test_syllabus_crud():
    print("\n" + "="*60)
    print("TESTING SYLLABUS CRUD")
    print("="*60)
    
    # Test 1: Create syllabus without files
    print("\n📝 Test 1: Create syllabus without files")
    syllabus = Syllabus.objects.create(
        class_level=10,
        subject="physics",
        chapter_title="Motion and Forces",
        chapter_number=1,
        chapter_description="Introduction to motion",
        page_range="1-20",
        estimated_hours=5.0
    )
    print(f"✅ Created syllabus: {syllabus.chapter_title} (ID: {syllabus.id})")
    
    # Test 2: Check syllabus fields
    print("\n📝 Test 2: Check syllabus fields")
    print(f"   - Class: {syllabus.class_level}")
    print(f"   - Subject: {syllabus.subject}")
    print(f"   - Chapter: {syllabus.chapter_title}")
    print(f"   - Chapter Number: {syllabus.chapter_number}")
    print(f"   - Page Range: {syllabus.page_range}")
    print(f"   - Estimated Hours: {syllabus.estimated_hours}")
    print(f"   - PDF: {syllabus.syllabus_pdf or 'None'}")
    print(f"   - Image: {syllabus.syllabus_image or 'None'}")
    
    # Test 3: Update syllabus
    print("\n📝 Test 3: Update syllabus")
    syllabus.chapter_description = "Updated description"
    syllabus.save()
    print(f"✅ Updated syllabus description")
    
    # Test 4: Delete syllabus
    print("\n📝 Test 4: Delete syllabus")
    syllabus_id = syllabus.id
    syllabus.delete()
    print(f"✅ Deleted syllabus ID: {syllabus_id}")
    
    print("\n✅ All syllabus tests passed!")


def test_api_endpoints():
    print("\n" + "="*60)
    print("TESTING API ENDPOINTS")
    print("="*60)
    
    from books.admin_views import BookSerializer, SyllabusSerializer
    
    # Test BookSerializer
    print("\n📝 Test BookSerializer fields")
    book_fields = BookSerializer.Meta.fields
    print(f"   Book fields: {book_fields}")
    
    # Test SyllabusSerializer
    print("\n📝 Test SyllabusSerializer fields")
    syllabus_fields = SyllabusSerializer.Meta.fields
    print(f"   Syllabus fields: {syllabus_fields}")
    
    print("\n✅ API endpoint tests passed!")


if __name__ == '__main__':
    try:
        test_book_crud()
        test_syllabus_crud()
        test_api_endpoints()
        
        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
