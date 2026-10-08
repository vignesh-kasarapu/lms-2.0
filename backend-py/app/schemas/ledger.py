from datetime import datetime

from pydantic import BaseModel


class LedgerEntryOut(BaseModel):
    entry_id: int
    entry_type: str
    quantity: float
    source_reference: str
    reason: str | None
    created_at: datetime
    running_balance: float


class LedgerAllEntryOut(BaseModel):
    entry_id: int
    employee_id: int
    employee_name: str
    employee_code: str
    leave_type_id: int
    leave_type_name: str
    entry_type: str
    quantity: float
    created_at: datetime


class AdjustBalanceIn(BaseModel):
    employee_id: int
    leave_type_id: int
    leave_year_id: int
    quantity: float
    reason: str
