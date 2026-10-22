#!/bin/sh
# Auto-creates the database and runs every Alembic migration BEFORE Uvicorn starts —
# not inside a FastAPI startup event, since multiple worker processes would race on
# `alembic upgrade head` with no locking. See app/core/bootstrap_db.py.
set -e

echo "Bootstrapping database..."
python -m app.core.bootstrap_db

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
