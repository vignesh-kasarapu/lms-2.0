from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.base import CamelOut
from app.schemas.leave_request import LeaveRequestOut, LeaveYearOut
from app.schemas.leave_type import LeaveTypeOut


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_id: int
    full_name: str
    work_email: str
    employee_code: str
    designation: str | None
    department_id: int | None
    grade_id: int | None
    management_level_id: int | None
    region_id: int | None
    reporting_manager_id: int | None
    gender: str | None
    marital_status: str | None
    status: str
    phone: str | None
    personal_email: str | None
    date_of_birth: date | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    has_avatar: bool = False

    @classmethod
    def from_model(cls, employee) -> "EmployeeOut":
        data = cls.model_validate(employee).model_dump()
        data["has_avatar"] = bool(employee.avatar_path)
        return cls(**data)


class OnboardEmployeeIn(BaseModel):
    full_name: str
    work_email: str
    employee_code: str
    date_of_joining: date
    designation: str
    role_code: str | None = None
    department_id: int | None = None
    department_name: str | None = None
    grade_id: int | None = None
    management_level_id: int | None = None
    region_id: int | None = None
    gender: str | None = None
    marital_status: str | None = None
    reporting_manager_id: int | None = None
    entra_oid: str | None = None


class UpdateEmployeeDetailsIn(BaseModel):
    full_name: str | None = None
    designation: str | None = None
    management_level_id: int | None = None
    gender: str | None = None
    marital_status: str | None = None
    region_id: int | None = None
    department_name: str | None = None


class UpdateOwnProfileIn(BaseModel):
    phone: str | None = None
    personal_email: str | None = None
    date_of_birth: date | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    gender: str | None = None
    marital_status: str | None = None


class UpdateManagerIn(BaseModel):
    manager_id: int


class DashboardBalanceCardOut(CamelOut):
    """Node's getDashboard hand-builds this — camelCase wrapper keys around a
    nested, still-snake_case LeaveType model dump. See app/schemas/base.py."""

    leave_type: LeaveTypeOut
    ledger_balance: float
    committed_to_open_requests: float
    effective_balance: float


class TeamMemberBalanceOut(CamelOut):
    """Node's getTeamBalances hand-builds this too, but with `leaveType` as
    just the type_name STRING — a genuinely different shape from the
    dashboard's nested model, not a copy/paste of the same schema."""

    leave_type: str
    ledger_balance: float
    committed_to_open_requests: float
    effective_balance: float


class TeamBalanceRowOut(CamelOut):
    employee: EmployeeOut
    balances: list[TeamMemberBalanceOut]

    @classmethod
    def from_row(cls, row: dict) -> "TeamBalanceRowOut":
        return cls(employee=EmployeeOut.from_model(row["employee"]), balances=[TeamMemberBalanceOut(**b) for b in row["balances"]])


class PeerCalendarEntryOut(BaseModel):
    request_id: int
    employee_id: int
    employee_name: str | None
    start_date: date
    end_date: date
    state: str


class TeamCalendarEntryOut(PeerCalendarEntryOut):
    leave_type_id: int
    leave_type_name: str | None


class DeactivateEmployeeIn(BaseModel):
    last_working_day: date


class ReassignManagerIn(BaseModel):
    new_manager_id: int
    transfer_pending_requests: bool = False


class DashboardOut(CamelOut):
    """Node's getDashboard hand-builds { balances, pending, upcoming,
    withdrawalWindow, leaveYear } — different key names from what the
    service/DAO layer calls these internally, not just different casing."""

    balances: list[DashboardBalanceCardOut]
    pending: list[LeaveRequestOut]
    upcoming: list[LeaveRequestOut]
    withdrawal_window: list[LeaveRequestOut]
    leave_year: LeaveYearOut
