import os
import django

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')

# Setup Django
django.setup()

# Now we can import and use Django models
from django.contrib.auth import get_user_model

User = get_user_model()

# List all users
users = User.objects.all()
print("Existing users:")
for user in users:
    print(f"Username: {user.username}, Email: {user.email}, Is Admin: {user.is_admin}")