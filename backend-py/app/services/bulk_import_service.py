"""Mirrors backend/src/services/bulkImport.service.js (LMS-019).

KNOWN LIMITATION vs. Node: Node wraps the whole import in one DB transaction,
so a circular-hierarchy failure partway through the manager-wiring pass rolls
back every employee created in the same batch. Several DAOs this service
depends on (employee_dao.create, role_dao.create_grant via
role_assignment_service, scheduled_job_run_dao.create via
accrual_service.post_opening_pro_rata) commit eagerly rather than only
flushing, so a failure on the LAST row's manager-wiring will NOT undo the
employee rows already committed for earlier rows in this same call. The
per-row validation pass below (which is read-only and runs to completion
before anything is created) is what actually prevents most bad imports;
only a circular-hierarchy failure discovered during the second pass can
leave a partial import committed. Flagged here rather than silently
pretending this port has the same atomicity guarantee as Node."""
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.dao import employee_dao
from app.services import accrual_service, approval_routing_service, audit_service, role_assignment_service

REQUIRED_FIELDS = ("full_name", "work_email", "employee_code", "date_of_joining", "designation")


def validate_rows(db: Session, rows: list[dict]) -> list[dict]:
    """LMS-019: validates every row first and produces a per-row error
    report. The whole file is accepted or rejected as a unit."""
    errors = []
    seen_codes: set[str] = set()
    seen_emails: set[str] = set()

    for i, row in enumerate(rows):
        row_number = i + 2  # header is row 1
        row_errors = []

        for field in REQUIRED_FIELDS:
            if not str(row.get(field) or "").strip():
                row_errors.append(f"Missing {field}")

        code = row.get("employee_code")
        if code:
            if code in seen_codes:
                row_errors.append(f"Duplicate employee code within file: {code}")
            seen_codes.add(code)
            if employee_dao.find_by_employee_code(db, code) is not None:
                row_errors.append(f"Employee code already exists: {code}")

        email = row.get("work_email")
        if email:
            if email in seen_emails:
                row_errors.append(f"Duplicate work email within file: {email}")
            seen_emails.add(email)
            if employee_dao.find_by_work_email(db, email) is not None:
                row_errors.append(f"Work email already exists: {email}")

        manager_code = row.get("reporting_manager_code")
        if manager_code:
            manager = employee_dao.find_by_employee_code(db, manager_code)
            manager_in_file = any(r.get("employee_code") == manager_code for r in rows)
            if manager is None and not manager_in_file:
                row_errors.append(f"Reporting manager code not found: {manager_code}")

        if row_errors:
            errors.append({"row": row_number, "employee_code": code or "(missing)", "errors": row_errors})

    return errors


def import_employees(db: Session, rows: list[dict], actor_id: int) -> dict:
    errors = validate_rows(db, rows)
    if errors:
        return {"committed": False, "errors": errors, "imported_count": 0}

    code_to_id: dict[str, int] = {}
    # First pass: create every row with no manager, so later rows can
    # reference earlier ones in the same file regardless of order.
    for row in rows:
        full_name = row["full_name"].strip()
        employee = employee_dao.create(
            db, entra_oid=row.get("entra_oid") or None, work_email=row["work_email"], employee_code=row["employee_code"],
            first_name=full_name.split(" ")[0], last_name=" ".join(full_name.split(" ")[1:]) or None,
            date_of_joining=row["date_of_joining"], designation=row["designation"],
        )
        code_to_id[row["employee_code"]] = employee.employee_id

        # Same baseline treatment single onboarding gives: opening pro-rata
        # credit + default EMPLOYEE role grant. Deliberately NOT sending the
        # onboarding-invite notification — per-row would spam a large batch.
        accrual_service.post_opening_pro_rata(db, employee.employee_id)
        role_assignment_service.assign_role(db, employee.employee_id, "EMPLOYEE", actor_id)

    # Second pass: wire up reporting managers now that every code has an id.
    for row in rows:
        manager_code = row.get("reporting_manager_code")
        if not manager_code:
            continue
        manager_id = code_to_id.get(manager_code)
        if manager_id is None:
            manager = employee_dao.find_by_employee_code(db, manager_code)
            manager_id = manager.employee_id if manager else None
        if manager_id is None:
            continue

        employee_id = code_to_id[row["employee_code"]]
        if approval_routing_service.would_create_circular_hierarchy(db, employee_id, manager_id):
            raise AppError(
                "CIRCULAR_HIERARCHY",
                f"Row for {row['employee_code']}: assigning manager {manager_code} would create a circular hierarchy. "
                "Import rolled back — no partial commit.",
            )
        employee = employee_dao.find_by_id(db, employee_id)
        employee_dao.update(db, employee, {"reporting_manager_id": manager_id})

    audit_service.record(
        db, action="BULK_EMPLOYEE_IMPORT", entity_type="employees", entity_id="bulk", actor_id=actor_id,
        new_value={"count": len(rows), "codes": [r["employee_code"] for r in rows]},
    )
    return {"committed": True, "errors": [], "imported_count": len(rows)}
