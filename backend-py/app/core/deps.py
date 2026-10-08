"""FastAPI dependencies mirroring backend/src/middleware/auth.middleware.js
exactly: dev-bypass branch (hard-blocked in production, see config.py's startup
guard), else Bearer-token-first-then-cookie, fresh Employee+roles re-fetch on
EVERY request (LMS-008 — roles are never trusted from the token)."""
from dataclasses import dataclass

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.exceptions import AppError
from app.core.security import decode_session_token
from app.dao import employee_dao, role_dao
from app.models.employee import Employee
from app.core.security import JWTError


@dataclass
class CurrentUser:
    employee_id: int
    employee: Employee
    roles: list[str]


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header[7:]
    return request.cookies.get(settings.session_cookie_name)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> CurrentUser:
    if settings.dev_auth_bypass_enabled:
        employee = employee_dao.find_by_employee_code(db, settings.dev_auth_bypass_employee_code)
        if employee is None:
            raise AppError("DEV_BYPASS_MISCONFIGURED", "Dev auth bypass employee code not found.", status=401)
    else:
        token = _extract_token(request)
        if not token:
            raise AppError("NO_SESSION", "No session token was provided.", status=401)
        try:
            employee_id = decode_session_token(token)
        except JWTError as exc:
            raise AppError("SESSION_INVALID", "Session token is invalid or expired.", status=401) from exc
        employee = employee_dao.find_by_id(db, employee_id)

    if employee is None or employee.status != "ACTIVE":
        raise AppError("NO_EMPLOYEE_RECORD", "No active employee record for this session.", status=401)

    roles = role_dao.get_role_codes_for_employee(db, employee.employee_id)
    return CurrentUser(employee_id=employee.employee_id, employee=employee, roles=roles)


def require_role(*allowed_roles: str):
    def _dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not set(allowed_roles) & set(user.roles):
            raise AppError("PERMISSION_DENIED", "You do not have permission to do this.", status=403)
        return user

    return _dependency
