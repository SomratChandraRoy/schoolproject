#!/bin/sh
set -eu

echo "[entrypoint] Running database migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python manage.py collectstatic --noinput

echo "[entrypoint] Ensuring default superuser exists..."
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
