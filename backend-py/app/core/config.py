"""App settings — mirrors backend/src/config/env.js field-for-field so the
Python backend can run against the same .env conventions as the Node one."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    port: int = 8000
    app_base_url: str = "http://localhost:8000"
    client_base_url: str = "http://localhost:5173"

    # Database — separate DB name from the Node app during parallel development
    # (see MIGRATION_PLAN.md §3) so the two ORMs never race on the same schema.
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = "lms_2_0_py"
    db_user: str = "root"
    db_password: str = "root"
    db_ssl: bool = False

    # Microsoft Entra ID (OIDC) — web client
    entra_tenant_id: str = ""
    entra_client_id: str = ""
    entra_client_secret: str = ""
    entra_redirect_uri: str = "http://localhost:8000/api/auth/callback"

    # Microsoft Entra ID — mobile public client (separate app registration, no secret)
    entra_mobile_client_id: str = ""
    entra_mobile_redirect_uri: str = "lms://auth"

    # Application session
    session_jwt_secret: str = "change_me_to_a_long_random_string"
    session_cookie_name: str = "lms_session"

    # Dev/test auth bypass — MUST default to disabled; refused at boot if enabled in production.
    dev_auth_bypass_enabled: bool = False
    dev_auth_bypass_employee_code: str = ""

    # Outbound mail (SMTP)
    mail_host: str = ""
    mail_port: int = 587
    mail_username: str = ""
    mail_password: str = ""
    smtp_from_address: str = "leave-system@yourorg.com"

    # Org defaults (only used as seed data, never hardcoded in business logic)
    default_timezone: str = "Asia/Kolkata"
    default_leave_year_start: str = "04-01"

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )


settings = Settings()

if settings.dev_auth_bypass_enabled and settings.environment == "production":
    # Mirrors backend/src/config/env.js's fatal startup guard exactly — this bypass
    # must never be reachable in production, regardless of a misconfigured env var.
    raise SystemExit(
        "FATAL: DEV_AUTH_BYPASS_ENABLED=true while ENVIRONMENT=production. Refusing to start."
    )
