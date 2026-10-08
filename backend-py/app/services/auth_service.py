"""Mirrors backend/src/services/auth.service.js's resolveEmployeeFromEntraClaims
+ the issue-session-token step. The Entra code-exchange/JWKS-verify mechanics
themselves live in app/core/entra.py (infrastructure, not a business rule);
this module is the one business-rule decision in the login path: which
Employee does this Entra identity map to, and are they allowed to sign in."""
from app.core.exceptions import AppError
from app.core.security import issue_session_token
from app.dao import employee_dao
from app.models.employee import Employee
from app.services import audit_service
from sqlalchemy.orm import Session


def resolve_employee_from_entra_claims(db: Session, claims: dict) -> Employee:
    """LMS-003. Raises 403 NO_EMPLOYEE_RECORD / EMPLOYEE_DEACTIVATED."""
    employee = employee_dao.find_by_entra_oid(db, claims["oid"])

    if employee is None and claims.get("email"):
        employee = employee_dao.find_by_work_email(db, claims["email"])
        if employee is not None:
            employee_dao.bind_entra_oid(db, employee, claims["oid"])

    if employee is None:
        audit_service.record(
            db,
            action="ACCESS_REFUSED_NO_EMPLOYEE_RECORD",
            entity_type="auth",
            entity_id=claims.get("email") or claims["oid"],
            is_system_actor=True,
            new_value={"oid": claims["oid"], "email": claims.get("email")},
        )
        raise AppError("NO_EMPLOYEE_RECORD", "No employee record matches this account.", status=403)

    if employee.status != "ACTIVE":
        raise AppError("EMPLOYEE_DEACTIVATED", "This employee account has been deactivated.", status=403)

    return employee


def sign_in(db: Session, employee: Employee) -> tuple[str, int]:
    """Issues the session token and audits SIGN_IN. Returns (token, expires_in_seconds)."""
    token, expires_in = issue_session_token(employee.employee_id)
    audit_service.record(
        db,
        action="SIGN_IN",
        entity_type="employees",
        entity_id=employee.employee_id,
        actor_id=employee.employee_id,
    )
    return token, expires_in


def sign_out(db: Session, employee_id: int | None) -> None:
    """LMS-007. Purely an audit entry — session invalidation is the caller
    clearing the cookie/discarding the token; there is no server-side blacklist."""
    if employee_id is not None:
        audit_service.record(
            db,
            action="SIGN_OUT",
            entity_type="employees",
            entity_id=employee_id,
            actor_id=employee_id,
        )
