#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
python <<PYEOF
import os, socket, sys, time

host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "5432"))
deadline = time.time() + 60

while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=2):
            sys.exit(0)
    except OSError:
        time.sleep(1)

print(f"Database not reachable at {host}:{port} after 60s", file=sys.stderr)
sys.exit(1)
PYEOF
echo "Database is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

if [ "${SEED_DATA:-0}" = "1" ]; then
    echo "Seeding demo data..."
    python manage.py seed
fi

if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
    echo "Ensuring superuser '${DJANGO_SUPERUSER_USERNAME}' exists..."
    python manage.py createsuperuser --noinput || true
fi

exec "$@"
