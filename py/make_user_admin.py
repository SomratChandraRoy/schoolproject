"""
Make a user an admin
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User

def make_admin():
    """Make a user an admin"""
    
    print("=" * 70)
    print("Make User Admin")
    print("=" * 70)
    print()
    
    # List all users
    users = User.objects.all()
    
    if not users.exists():
        print("❌ No users found in database")
        print()
        print("Create a user first:")
        print("  python create_admin_user.py")
        return
    
    print("Available users:")
    for i, user in enumerate(users, 1):
        admin_status = "✅ ADMIN" if user.is_admin else "❌ Not Admin"
        print(f"  {i}. {user.username} ({user.email}) - {admin_status}")
    print()
    
    # Get username
    username = input("Enter username to make admin: ").strip()
    
    try:
        user = User.objects.get(username=username)
        
        print()
        print(f"User found: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  Current status:")
        print(f"    - is_admin: {user.is_admin}")
        print(f"    - is_staff: {user.is_staff}")
        print(f"    - is_superuser: {user.is_superuser}")
        print()
        
        # Make admin
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save()
        
        print("✅ User is now an admin!")
        print()
        print("Updated status:")
        print(f"  - is_admin: {user.is_admin}")
        print(f"  - is_staff: {user.is_staff}")
        print(f"  - is_superuser: {user.is_superuser}")
        print()
        print("You can now login and access the Superuser Dashboard!")
        
    except User.DoesNotExist:
        print(f"❌ User '{username}' not found")
        print()
        print("Available users:")
        for user in users:
            print(f"  - {user.username}")
    
    print()
    print("=" * 70)

if __name__ == '__main__':
    make_admin()
