#!/usr/bin/env python
"""
Create admin user for MedhaBangla project
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User

# Create admin user
username = 'admin'
email = 'admin@medhabangla.com'
password = 'admin123'  # Change this to a secure password

# Check if user already exists
if User.objects.filter(username=username).exists():
    print(f'✅ User "{username}" already exists')
    user = User.objects.get(username=username)
else:
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name='Admin',
        last_name='User',
        class_level=12,  # Default class
        is_staff=True,
        is_superuser=True
    )
    print(f'✅ Admin user created successfully!')
    print(f'   Username: {username}')
    print(f'   Password: {password}')
    print(f'   Email: {email}')

# Ensure user is admin
user.role = 'admin'
user.is_staff = True
user.is_superuser = True
user.save()

print(f'\n✅ User "{username}" is now an admin with superuser privileges')
print(f'\n🔐 Login credentials:')
print(f'   Username: {username}')
print(f'   Password: {password}')
print(f'\n🌐 Access:')
print(f'   Admin panel: http://localhost:8000/admin/')
print(f'   Superuser page: http://localhost:8000/superuser/')
