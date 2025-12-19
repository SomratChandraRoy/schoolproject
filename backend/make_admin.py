import os
import django

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')

# Setup Django
django.setup()

# Now we can import and use Django models
from django.contrib.auth import get_user_model

User = get_user_model()

# Make the admin user a superuser
try:
    user = User.objects.get(username='admin')
    user.is_staff = True
    user.is_superuser = True
    user.is_admin = True
    user.save()
    print(f"User '{user.username}' has been made an admin successfully!")
except User.DoesNotExist:
    print("User 'admin' does not exist.")
except Exception as e:
    print(f"Error updating user: {e}")