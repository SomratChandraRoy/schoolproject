#!/bin/sh
set -eu

echo "[dev-entrypoint] Waiting for database and applying migrations..."
python manage.py migrate --noinput

echo "[dev-entrypoint] Ensuring default superuser exists..."
python manage.py shell <<'PY'
from django.contrib.auth import get_user_model

User = get_user_model()
username = "bipulroy"
password = "Bipul10000$"
email = "admin@medhabangla.local"

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        "email": email,
        "is_staff": True,
        "is_superuser": True,
        "is_active": True,
    },
)

if created:
    user.set_password(password)
    user.save(update_fields=["password"])
    print(f"Created superuser '{username}'")
else:
    if not user.is_staff or not user.is_superuser:
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["is_staff", "is_superuser"])
    print(f"Superuser '{username}' already exists")
PY

echo "[dev-entrypoint] Starting Django development server..."
exec python manage.py runserver 0.0.0.0:8000
