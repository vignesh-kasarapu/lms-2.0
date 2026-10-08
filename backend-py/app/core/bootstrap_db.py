"""Auto-creates the database (if missing) and runs every Alembic migration.

Run before Uvicorn starts (see entrypoint.sh) so a fresh clone + `docker compose up`
needs zero manual DB setup. Uses alembic.command.upgrade (in-process), not a
subprocess, and a raw no-database connection for the CREATE DATABASE step since
you can't select a database that doesn't exist yet.
"""
import pathlib

import pymysql
from alembic import command
from alembic.config import Config

from app.core.config import settings

BACKEND_PY_ROOT = pathlib.Path(__file__).resolve().parents[2]
ALEMBIC_INI_PATH = BACKEND_PY_ROOT / "alembic.ini"


def ensure_database_exists() -> None:
    conn = pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
    finally:
        conn.close()


def run_migrations() -> None:
    cfg = Config(str(ALEMBIC_INI_PATH))
    cfg.set_main_option("script_location", str(BACKEND_PY_ROOT / "alembic"))
    cfg.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_uri)
    command.upgrade(cfg, "head")


def bootstrap() -> None:
    ensure_database_exists()
    run_migrations()


if __name__ == "__main__":
    bootstrap()
    print(f"OK: database '{settings.db_name}' exists and is migrated to head.")
