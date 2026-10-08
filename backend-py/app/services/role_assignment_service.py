"""Mirrors backend/src/services/roleAssignment.service.js."""
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.dao import role_dao
from app.services import audit_service

ALLOWED_ROLE_CODES = ("EMPLOYEE", "MANAGER", "HR_ADMIN")


def assign_role(db: Session, employee_id: int, role_code: str, actor_id: int) -> None:
    if role_code not in ALLOWED_ROLE_CODES:
        raise AppError("VALIDATION_ERROR", f"'{role_code}' is not a valid role.")
    role = role_dao.find_role_by_code(db, role_code)
    if role is None:
        raise AppError("VALIDATION_ERROR", f"Role '{role_code}' has not been seeded.", status=500)

    if role_dao.find_grant(db, employee_id, role.role_id) is not None:
        return  # idempotent — already held

    role_dao.create_grant(db, employee_id, role.role_id)
    audit_service.record(
        db, action="ROLE_ASSIGNED", entity_type="employees", entity_id=f"{employee_id}:{role.role_id}",
        actor_id=actor_id, new_value={"role_code": role_code},
    )


def revoke_role(db: Session, employee_id: int, role_code: str, actor_id: int) -> None:
    role = role_dao.find_role_by_code(db, role_code)
    if role is None:
        raise AppError("VALIDATION_ERROR", f"Role '{role_code}' has not been seeded.", status=500)

    if role_code == "HR_ADMIN" and role_dao.count_holders(db, role.role_id) <= 1:
        raise AppError("LAST_HR_ADMIN", "At least one HR/Admin must exist at all times.")

    audit_service.record(
        db, action="ROLE_REVOKED", entity_type="employees", entity_id=f"{employee_id}:{role.role_id}",
        actor_id=actor_id, prior_value={"role_code": role_code},
    )
    role_dao.delete_grant(db, employee_id, role.role_id)


def list_roles_for_employee(db: Session, employee_id: int) -> list[str]:
    return role_dao.get_role_codes_for_employee(db, employee_id)
