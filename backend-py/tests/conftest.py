"""Test fixtures. Runs against the same local dev MySQL database backend-py
uses (lms_2_0_py) — there's no CI/isolated test DB yet (flagged as a later
improvement), so fixtures are written find-or-create/idempotent rather than
assuming a blank schema, matching how seed.js/seedDemo.js already work in the
Node app."""
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.db import SessionLocal
from app.main import app
from app.models.employee import Employee
from app.models.org_structure import Role
from app.services import role_assignment_service

TEST_EMPLOYEE_CODE = "TEST001"


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def test_employee(db):
    employee = db.query(Employee).filter_by(employee_code=TEST_EMPLOYEE_CODE).first()
    if employee is None:
        employee = Employee(
            work_email="test001@example.com",
            employee_code=TEST_EMPLOYEE_CODE,
            first_name="Auth",
            last_name="Tester",
            date_of_joining=date(2024, 1, 1),
            designation="Test Employee",
            is_active=True,
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
    return employee


@pytest.fixture()
def client():
    return TestClient(app)


def _ensure_role(db, code, name):
    role = db.query(Role).filter_by(role_code=code).first()
    if role is None:
        role = Role(role_code=code, role_name=name)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


@pytest.fixture()
def hr_admin(db):
    """Shared across test_employees.py and test_admin.py — every admin-surface
    endpoint is HR_ADMIN-only, so both need the same authenticated actor."""
    _ensure_role(db, "EMPLOYEE", "Employee")
    _ensure_role(db, "HR_ADMIN", "HR Admin")
    employee = db.query(Employee).filter_by(employee_code="TESTHR").first()
    if employee is None:
        employee = Employee(
            work_email="testhr@example.com", employee_code="TESTHR", first_name="HR", last_name="Admin",
            date_of_joining=date(2024, 1, 1), designation="HR Admin", is_active=True,
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
    role_assignment_service.assign_role(db, employee.employee_id, "HR_ADMIN", employee.employee_id)
    return employee


@pytest.fixture()
def as_hr_admin(client, hr_admin, monkeypatch):
    monkeypatch.setattr(settings, "dev_auth_bypass_enabled", True)
    monkeypatch.setattr(settings, "dev_auth_bypass_employee_code", hr_admin.employee_code)
    return client
