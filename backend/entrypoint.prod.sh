#!/bin/sh
set -eu

wait_for_postgres() {
    use_sqlite="$(printf '%s' "${USE_SQLITE:-False}" | tr '[:upper:]' '[:lower:]')"
    if [ "$use_sqlite" = "true" ] || [ -z "${DB_HOST:-}" ]; then
        echo "[entrypoint] PostgreSQL wait skipped (USE_SQLITE=true or DB_HOST missing)."
        return 0
    fi

    echo "[entrypoint] Waiting for PostgreSQL to become reachable..."
    attempts=0
    max_attempts=60

    while [ "$attempts" -lt "$max_attempts" ]; do
        if python - <<'PY'
import os
import sys

import psycopg2

try:
        conn = psycopg2.connect(
                host=os.getenv("DB_HOST", ""),
                port=os.getenv("DB_PORT", "5432"),
                dbname=os.getenv("DB_NAME", "postgres"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", ""),
                connect_timeout=5,
                sslmode=os.getenv("DB_SSLMODE", "prefer"),
        )
        conn.close()
except Exception:
        sys.exit(1)

sys.exit(0)
PY
        then
            echo "[entrypoint] PostgreSQL is reachable."
            return 0
        fi

        attempts=$((attempts + 1))
        echo "[entrypoint] PostgreSQL not ready yet (${attempts}/${max_attempts}); retrying in 5s..."
        sleep 5
    done

    echo "[entrypoint][ERROR] PostgreSQL is not reachable after waiting."
    return 1
}

ensure_writable_dir() {
    dir_path="$1"
    test_file="${dir_path}/.write-test"

    if touch "$test_file" 2>/dev/null; then
        rm -f "$test_file"
        return 0
    fi

    echo "[entrypoint][ERROR] Directory is not writable: ${dir_path}"
    ls -ld "$dir_path" || true
    return 1
}

wait_for_postgres

echo "[entrypoint] Verifying writable media/static mounts..."
ensure_writable_dir /app/media
ensure_writable_dir /app/staticfiles

echo "[entrypoint] Running database migrations..."
migration_attempt=0
max_migration_attempts=5
until python manage.py migrate --noinput; do
    migration_attempt=$((migration_attempt + 1))
    if [ "$migration_attempt" -ge "$max_migration_attempts" ]; then
        echo "[entrypoint][ERROR] Database migrations failed after ${max_migration_attempts} attempts."
        exit 1
    fi

    echo "[entrypoint] Migration attempt ${migration_attempt} failed; retrying in 10s..."
    sleep 10
done

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
