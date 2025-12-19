import os
import django
from django.conf import settings

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')

# Setup Django
django.setup()

# Now we can import and use Django models
from django.contrib.auth import get_user_model

User = get_user_model()

# Create superuser
try:
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin'
    )
    print("Superuser created successfully!")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
except Exception as e:
    print(f"Error creating superuser: {e}")