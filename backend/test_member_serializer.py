#!/usr/bin/env python
"""
Quick test script to verify is_member field is included in serializers
Run this to confirm the fix is working
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.serializers import UserSerializer, UserProfileSerializer
from accounts.models import User


def test_serializers():
    print("=" * 80)
    print("🧪 Testing User Serializers for is_member Field")
    print("=" * 80)
    
    # Check UserSerializer
    print("\n1️⃣ UserSerializer")
    print("-" * 80)
    user_fields = UserSerializer.Meta.fields
    user_readonly = UserSerializer.Meta.read_only_fields
    
    if 'is_member' in user_fields:
        print("✅ 'is_member' found in fields")
    else:
        print("❌ 'is_member' NOT found in fields")
        print(f"   Current fields: {user_fields}")
    
    if 'is_member' in user_readonly:
        print("✅ 'is_member' found in read_only_fields")
    else:
        print("❌ 'is_member' NOT found in read_only_fields")
        print(f"   Current read_only_fields: {user_readonly}")
    
    # Check UserProfileSerializer
    print("\n2️⃣ UserProfileSerializer")
    print("-" * 80)
    profile_fields = UserProfileSerializer.Meta.fields
    profile_readonly = UserProfileSerializer.Meta.read_only_fields
    
    if 'is_member' in profile_fields:
        print("✅ 'is_member' found in fields")
    else:
        print("❌ 'is_member' NOT found in fields")
        print(f"   Current fields: {profile_fields}")
    
    if 'is_member' in profile_readonly:
        print("✅ 'is_member' found in read_only_fields")
    else:
        print("❌ 'is_member' NOT found in read_only_fields")
        print(f"   Current read_only_fields: {profile_readonly}")
    
    # Test with actual user if available
    print("\n3️⃣ Testing with Actual User Data")
    print("-" * 80)
    
    try:
        # Get first user
        user = User.objects.first()
        if user:
            print(f"Testing with user: {user.username}")
            print(f"Database is_member value: {user.is_member}")
            
            # Serialize user
            serializer = UserSerializer(user)
            serialized_data = serializer.data
            
            if 'is_member' in serialized_data:
                print(f"✅ Serialized data includes is_member: {serialized_data['is_member']}")
            else:
                print("❌ Serialized data does NOT include is_member")
                print(f"   Available keys: {list(serialized_data.keys())}")
            
            # Test profile serializer
            profile_serializer = UserProfileSerializer(user)
            profile_data = profile_serializer.data
            
            if 'is_member' in profile_data:
                print(f"✅ Profile data includes is_member: {profile_data['is_member']}")
            else:
                print("❌ Profile data does NOT include is_member")
                print(f"   Available keys: {list(profile_data.keys())}")
        else:
            print("⚠️  No users found in database")
    except Exception as e:
        print(f"❌ Error testing with user: {e}")
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 Summary")
    print("=" * 80)
    
    all_good = (
        'is_member' in user_fields and
        'is_member' in user_readonly and
        'is_member' in profile_fields and
        'is_member' in profile_readonly
    )
    
    if all_good:
        print("✅ ALL CHECKS PASSED!")
        print("\n✨ Next Steps:")
        print("   1. Restart backend server: python manage.py runserver")
        print("   2. Users should logout and login again")
        print("   3. Test /chat page with member account")
        return 0
    else:
        print("❌ SOME CHECKS FAILED!")
        print("\n🔧 Action Required:")
        print("   1. Check backend/accounts/serializers.py")
        print("   2. Ensure 'is_member' is in both fields and read_only_fields")
        print("   3. Run this test again")
        return 1


if __name__ == '__main__':
    sys.exit(test_serializers())
