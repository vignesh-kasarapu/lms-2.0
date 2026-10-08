from datetime import date, datetime
from typing import Any

from pydantic import BaseModel


class LeaveTakenRowOut(BaseModel):
    request_id: int
    employee_id: int
    employee_name: str
    employee_code: str
    department_id: int | None
    grade_id: int | None
    leave_type_id: int
    leave_type_name: str
    start_date: date
    end_date: date
    state: str
    deducted_days: float | None


class LopReportRowOut(BaseModel):
    lop_record_id: int
    request_id: int
    employee_id: int
    employee_name: str
    employee_code: str
    start_date: date
    end_date: date
    deducted_days: float
    converted_at: datetime


class BalanceReportRowOut(BaseModel):
    entry_id: int
    employee_id: int
    employee_name: str
    employee_code: str
    leave_type_id: int
    leave_type_name: str
    entry_type: str
    quantity: float
    created_at: datetime


class AuditLogRowOut(BaseModel):
    audit_id: int
    actor_id: int | None
    actor_name: str | None
    is_system_actor: bool
    action: str
    entity_type: str
    entity_id: str
    prior_value: Any
    new_value: Any
    timestamp: datetime
