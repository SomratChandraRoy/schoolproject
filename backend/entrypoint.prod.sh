#!/bin/sh
set -eu

echo "[entrypoint] Running database migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "[entrypoint] Checking optional superuser bootstrap..."
python manage.py shell <<'PY'
import os
from django.contrib.auth import get_user_model

User = get_user_model()
auto_create = os.getenv("AUTO_CREATE_SUPERUSER", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

if not auto_create:
    print("Auto superuser bootstrap disabled (AUTO_CREATE_SUPERUSER=false)")
    raise SystemExit(0)

username = os.getenv("DJANGO_SUPERUSER_USERNAME", "").strip()
password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "").strip()
email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@medhabangla.local").strip() or "admin@medhabangla.local"

if not username or not password:
    print("AUTO_CREATE_SUPERUSER enabled, but username/password missing. Skipping.")
    raise SystemExit(0)

user, created = User.objects.get_or_create(
    username=username,
    defaults={
        "email": email,
        "is_staff": True,
        "is_superuser": True,
        "is_active": True,
        "is_admin": True,
        "role": "enterprise",
        "is_banned": False,
        "ban_reason": None,
    },
)

if created:
    user.set_password(password)
    user.save(update_fields=["password"])
    print(f"Created superuser '{username}'")
else:
    update_fields = []

    if not user.is_staff:
        user.is_staff = True
        update_fields.append("is_staff")

    if not user.is_superuser:
        user.is_superuser = True
        update_fields.append("is_superuser")

    if hasattr(user, "is_admin") and not user.is_admin:
        user.is_admin = True
        update_fields.append("is_admin")

    if hasattr(user, "role") and user.role == "ban":
        user.role = "enterprise"
        update_fields.append("role")

    if hasattr(user, "is_banned") and user.is_banned:
        user.is_banned = False
        update_fields.append("is_banned")

    if hasattr(user, "ban_reason") and user.ban_reason:
        user.ban_reason = None
        update_fields.append("ban_reason")

    if update_fields:
        user.save(update_fields=update_fields)

    print(f"Superuser '{username}' already exists")
PY

echo "[entrypoint] Starting application..."
exec "$@"
