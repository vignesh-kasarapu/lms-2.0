import uuid


def test_onboard_then_fetch_via_me(as_hr_admin, db):
    code = f"ONB{uuid.uuid4().hex[:8].upper()}"
    res = as_hr_admin.post("/api/employees", json={
        "full_name": "New Hire", "work_email": f"{code}@example.com", "employee_code": code,
        "date_of_joining": "2025-01-01", "designation": "Engineer", "department_name": "Engineering",
    })
    assert res.status_code == 201, res.text
    body = res.json()["data"]
    assert body["employee_code"] == code
    assert body["department_id"] is not None


def test_manager_assignment_rejects_a_circular_chain(as_hr_admin, db):
    suffix = uuid.uuid4().hex[:8].upper()
    a = as_hr_admin.post("/api/employees", json={
        "full_name": "Chain A", "work_email": f"chaina{suffix}@example.com", "employee_code": f"CHA{suffix}",
        "date_of_joining": "2025-01-01", "designation": "Engineer", "department_name": "Engineering",
    }).json()["data"]
    b = as_hr_admin.post("/api/employees", json={
        "full_name": "Chain B", "work_email": f"chainb{suffix}@example.com", "employee_code": f"CHB{suffix}",
        "date_of_joining": "2025-01-01", "designation": "Engineer", "department_name": "Engineering",
    }).json()["data"]

    ok = as_hr_admin.patch(f"/api/employees/{b['employee_id']}/manager", json={"manager_id": a["employee_id"]})
    assert ok.status_code == 200

    circular = as_hr_admin.patch(f"/api/employees/{a['employee_id']}/manager", json={"manager_id": b["employee_id"]})
    assert circular.status_code == 400
    assert circular.json()["error"]["code"] == "CIRCULAR_HIERARCHY"


def test_self_service_profile_ignores_org_controlled_fields(as_hr_admin, hr_admin):
    res = as_hr_admin.patch("/api/employees/me", json={"designation": "CEO", "phone": "+91 90000 00000"})
    assert res.status_code == 200
    body = res.json()["data"]
    assert body["designation"] == "HR Admin"  # unchanged — designation isn't in the self-service allow-list
    assert body["phone"] == "+91 90000 00000"  # this one is


def test_cannot_revoke_the_last_hr_admin(as_hr_admin, hr_admin, db):
    # This dev DB is shared across test runs (see conftest.py) and may already
    # have other HR_ADMIN holders from prior manual testing — strip them all
    # down to exactly the fixture's employee so the guard is actually exercised.
    from app.models.org_structure import EmployeeRole, Role

    hr_role = db.query(Role).filter_by(role_code="HR_ADMIN").first()
    other_holders = (
        db.query(EmployeeRole)
        .filter(EmployeeRole.role_id == hr_role.role_id, EmployeeRole.employee_id != hr_admin.employee_id)
        .all()
    )
    for grant in other_holders:
        db.delete(grant)
    db.commit()

    res = as_hr_admin.delete(f"/api/employees/{hr_admin.employee_id}/roles", params={"role_code": "HR_ADMIN"})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "LAST_HR_ADMIN"
