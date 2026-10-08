"""Mirrors leaveRequest.controller.js's getScopedDetail/myRequests/
approvalsQueue read paths. NFR-13/BR-42: full request detail is visible only
to the employee, their approvers in the chain, and HR/Admin. A Watcher gets a
masked projection — dates, status, leave type (Sick rendered as
"Unavailable") — never reason/attachments. Anyone else is refused outright.
Masking is applied here, at the service layer, never left for the client to
hide."""
from sqlalchemy.orm import Session

from app.dao import (
    delegation_dao,
    employee_dao,
    leave_request_approval_dao,
    leave_request_attachment_dao,
    leave_request_dao,
    leave_request_query_dao,
    leave_type_dao,
    watcher_dao,
)
from app.schemas.leave_request import LeaveRequestOut


def get_scoped_detail(db: Session, request_id: int, viewer_id: int, viewer_is_hr_admin: bool) -> dict:
    request = leave_request_dao.find_by_id(db, request_id)
    if request is None:
        return {"scope": "DENIED", "request": None}

    is_owner = request.employee_id == viewer_id
    is_current_approver = request.current_approver_id == viewer_id
    has_approved_in_chain = leave_request_approval_dao.actor_has_approved(db, request_id, viewer_id)
    is_full_access = is_owner or viewer_is_hr_admin or is_current_approver or has_approved_in_chain

    if is_full_access:
        return {"scope": "FULL", "request": _build_full_detail(db, request)}

    watchers = watcher_dao.list_for_request(db, request_id)
    if any(w.watcher_employee_id == viewer_id for w in watchers):
        leave_type = leave_type_dao.find_by_id(db, request.leave_type_id)
        masked = {
            "request_id": request.request_id, "start_date": request.start_date, "end_date": request.end_date,
            "state": request.state, "deducted_days": request.deducted_days,  # a day COUNT, safe per BR-42
            "employee_id": request.employee_id,
            "leave_type_name": "Unavailable" if leave_type.is_sick_leave else leave_type.type_name,
        }
        return {"scope": "WATCHER_MASKED", "request": masked}

    return {"scope": "DENIED", "request": None}


def _build_full_detail(db: Session, request) -> dict:
    """Mirrors Node's getScopedDetail's eager-loaded associations (LeaveType,
    approvals, watchers+watcherEmployee name, currentApprover, attachments) —
    RequestDetail.jsx reads all of these directly off the request object, not
    from separate endpoints. The bare LeaveRequest row alone (this function's
    previous behavior) left the web/mobile approval-timeline, watcher, and
    attachment sections silently empty."""
    leave_type = leave_type_dao.find_by_id(db, request.leave_type_id)
    approvals = leave_request_approval_dao.list_for_request(db, request.request_id)
    watchers = watcher_dao.list_for_request(db, request.request_id)
    attachments = leave_request_attachment_dao.list_for_request(db, request.request_id)
    current_approver = employee_dao.find_by_id(db, request.current_approver_id) if request.current_approver_id else None

    return {
        **LeaveRequestOut.model_validate(request).model_dump(),
        "LeaveType": {"type_name": leave_type.type_name, "permits_attachments": leave_type.permits_attachments} if leave_type else None,
        "currentApprover": {"full_name": current_approver.full_name} if current_approver else None,
        "approvals": [
            {
                "approval_id": a.approval_id,
                "stage": a.stage,
                "decision": a.decision,
                "on_behalf_of_id": a.on_behalf_of_id,
                "reason": a.reason,
                "decision_timestamp": a.decision_timestamp,
            }
            for a in approvals
        ],
        "watchers": [
            {
                "watcher_id": w.watcher_id,
                "watcher_employee_id": w.watcher_employee_id,
                "watcherEmployee": (
                    {"full_name": watcher_employee.full_name}
                    if (watcher_employee := employee_dao.find_by_id(db, w.watcher_employee_id))
                    else None
                ),
            }
            for w in watchers
        ],
        "attachments": [
            {
                "attachment_id": a.attachment_id,
                "file_name": a.file_name,
                "content_type": a.content_type,
                "size_bytes": a.size_bytes,
            }
            for a in attachments
        ],
    }


def list_own(db: Session, employee_id: int):
    return leave_request_dao.list_own(db, employee_id)


def list_approvals_queue(db: Session, viewer_id: int, viewer_is_hr_admin: bool):
    """current_approver_id only identifies a specific PERSON — that fits the
    Manager stage and a cancellation decision, but PENDING_HR is a ROLE grant,
    never assigned an individual's id — every HR/Admin must see every
    PENDING_HR request."""
    rows = leave_request_query_dao.list_manager_queue(db, viewer_id)
    if viewer_is_hr_admin:
        rows = rows + leave_request_query_dao.list_hr_queue(db)

    enriched = []
    for request in rows:
        is_delegated = False
        delegated_for = None
        if request.current_approver_id == viewer_id:
            submitted_at = request.application_timestamp or request.created_at
            employee_manager_id = None
            from app.dao import employee_dao

            request_employee = employee_dao.find_by_id(db, request.employee_id)
            employee_manager_id = request_employee.reporting_manager_id if request_employee else None
            if employee_manager_id and employee_manager_id != viewer_id:
                # This remains true even if the delegation is revoked later,
                # because the request was already routed to this user —
                # deliberately ignores revoked_at, same as decide()'s
                # audit-context reconstruction.
                delegation = delegation_dao.find_match_for_audit_context(db, employee_manager_id, viewer_id, submitted_at.date())
                if delegation is not None:
                    is_delegated = True
                    delegated_for = employee_manager_id

        enriched.append(
            {
                "request": request, "is_delegated": is_delegated, "delegated_for": delegated_for,
                "decision_type": "CANCELLATION" if request.state == "CANCELLATION_REQUESTED" else "REQUEST",
            }
        )
    return enriched
