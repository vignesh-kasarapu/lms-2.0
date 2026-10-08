"""Thin — mirrors backend/src/routes/leaveRequest.routes.js +
leaveRequest.controller.js."""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import CurrentUser, get_current_user, require_role
from app.core.exceptions import AppError
from app.core.responses import created, ok
from app.schemas.leave_request import (
    AddWatcherIn,
    CancellationDecisionIn,
    DecisionIn,
    DraftIn,
    DraftUpdateIn,
    LeaveRequestOut,
    PreviewOut,
    SubmitRequestIn,
)
from app.services import leave_request as leave_request_service
from app.services import watcher_service

router = APIRouter()


@router.get("/preview")
def preview(
    leave_type_id: int, start_date: date, end_date: date, is_half_day: bool = False,
    db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user),
):
    result = leave_request_service.preview_application(db, user.employee_id, leave_type_id, start_date, end_date, is_half_day)
    return ok(PreviewOut(**result).model_dump(by_alias=True))


@router.post("", status_code=201)
def submit(payload: SubmitRequestIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    request = leave_request_service.submit_request(
        db, user.employee_id, payload.leave_type_id, payload.start_date, payload.end_date,
        payload.is_half_day, payload.half_day_portion, payload.reason, payload.attachment_refs,
    )
    return created(LeaveRequestOut.model_validate(request).model_dump())


@router.post("/draft", status_code=201)
def save_draft(payload: DraftIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    request = leave_request_service.save_draft(
        db, user.employee_id, payload.leave_type_id, payload.start_date, payload.end_date,
        payload.is_half_day, payload.half_day_portion, payload.reason,
    )
    return created(LeaveRequestOut.model_validate(request).model_dump())


@router.patch("/draft/{request_id}")
def update_draft(request_id: int, payload: DraftUpdateIn, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    request = leave_request_service.update_draft(db, request_id, user.employee_id, payload.model_dump(exclude_unset=True))
    return ok(LeaveRequestOut.model_validate(request).model_dump())


@router.delete("/draft/{request_id}")
def discard_draft(request_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    result = leave_request_service.discard_draft(db, request_id, user.employee_id)
    return ok(result)


@router.post("/draft/{request_id}/submit", status_code=201)
def submit_draft(request_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    request = leave_request_service.submit_draft(db, request_id, user.employee_id)
    return created(LeaveRequestOut.model_validate(request).model_dump())


@router.get("/my")
def my_requests(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    rows = leave_request_service.list_own(db, user.employee_id)
    return ok([LeaveRequestOut.model_validate(r).model_dump() for r in rows])


@router.get("/approvals-queue")
def approvals_queue(db: Session = Depends(get_db), user: CurrentUser = Depends(require_role("MANAGER", "HR_ADMIN"))):
    is_hr_admin = "HR_ADMIN" in user.roles
    rows = leave_request_service.list_approvals_queue(db, user.employee_id, is_hr_admin)
    return ok(
        [
            {
                **LeaveRequestOut.model_validate(row["request"]).model_dump(),
                "is_delegated": row["is_delegated"], "delegated_for": row["delegated_for"],
                "decision_type": row["decision_type"],
            }
            for row in rows
        ]
    )


@router.get("/{request_id}")
def detail(request_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    is_hr_admin = "HR_ADMIN" in user.roles
    result = leave_request_service.get_scoped_detail(db, request_id, user.employee_id, is_hr_admin)
    if result["scope"] == "DENIED":
        raise AppError("PERMISSION_DENIED", "You do not have permission to view this request.", status=403)
    if result["scope"] == "FULL":
        # result["request"] is already the fully-shaped dict from the service
        # (base LeaveRequestOut fields plus LeaveType/approvals/watchers/
        # attachments/currentApprover) — re-validating it through
        # LeaveRequestOut here would silently strip those extra keys back off.
        return ok({"scope": "FULL", "request": result["request"]})
    return ok({"scope": "WATCHER_MASKED", "request": result["request"]})


@router.post("/{request_id}/decision")
def decide(request_id: int, payload: DecisionIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_role("MANAGER", "HR_ADMIN"))):
    request = leave_request_service.decide(db, request_id, user.employee_id, payload.decision, payload.reason)
    return ok(LeaveRequestOut.model_validate(request).model_dump())


@router.post("/{request_id}/withdraw")
def withdraw(request_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    request = leave_request_service.withdraw(db, request_id, user.employee_id)
    return ok(LeaveRequestOut.model_validate(request).model_dump())


@router.post("/{request_id}/cancellation")
def request_cancellation(request_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    request = leave_request_service.request_cancellation(db, request_id, user.employee_id)
    return ok(LeaveRequestOut.model_validate(request).model_dump())


@router.post("/{request_id}/cancellation/decision")
def decide_cancellation(request_id: int, payload: CancellationDecisionIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_role("MANAGER", "HR_ADMIN"))):
    request = leave_request_service.decide_cancellation(db, request_id, user.employee_id, payload.decision, payload.unelapsed_days)
    return ok(LeaveRequestOut.model_validate(request).model_dump())


@router.post("/{request_id}/watchers", status_code=201)
def add_watcher(request_id: int, payload: AddWatcherIn, db: Session = Depends(get_db), user: CurrentUser = Depends(require_role("MANAGER", "HR_ADMIN"))):
    is_hr_admin = "HR_ADMIN" in user.roles
    watcher = watcher_service.add_watcher(db, request_id, payload.watcher_employee_id, user.employee_id, is_hr_admin)
    return created({"watcher_id": watcher.watcher_id, "watcher_employee_id": watcher.watcher_employee_id})


@router.delete("/{request_id}/watchers/{watcher_id}")
def remove_watcher(request_id: int, watcher_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(require_role("MANAGER", "HR_ADMIN"))):
    is_hr_admin = "HR_ADMIN" in user.roles
    result = watcher_service.remove_watcher(db, request_id, watcher_id, user.employee_id, is_hr_admin)
    return ok(result)
