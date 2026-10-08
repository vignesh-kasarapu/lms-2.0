"""Mirrors leaveRequest.service.js's validation helpers (top of file)."""
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.dao import leave_request_dao
from app.services import config_service


def assert_valid_date_span(start_date: date, end_date: date) -> None:
    """A request's end date can never be before its start date — an inverted
    span would silently walk backwards (and off the start of the intended
    range) rather than throwing, so this must be checked explicitly before any
    deduction math runs."""
    if end_date < start_date:
        raise AppError("INVALID_DATE_RANGE", "End date cannot be before start date.")


def assert_valid_half_day(start_date: date, end_date: date, is_half_day: bool) -> None:
    """BR-34: a half-day only ever means half of a single day — a multi-day
    span can't be "half"."""
    if is_half_day and start_date != end_date:
        raise AppError("INVALID_HALF_DAY", "A half-day request must have the same start and end date.")


def assert_no_overlap(db: Session, employee_id: int, start_date: date, end_date: date, exclude_request_id: int | None = None) -> None:
    """LMS-037: refuse overlap with the employee's own request in
    Pending/Approved/Cancellation Requested."""
    existing = leave_request_dao.find_overlapping_for_employee(db, employee_id, start_date, end_date, exclude_request_id)
    if existing is not None:
        raise AppError(
            "OVERLAP",
            f"This overlaps an existing request (#{existing.request_id}, {existing.start_date} to {existing.end_date}).",
        )


def assert_within_backdating_window(db: Session, start_date: date, leave_year) -> None:
    """BR-27/BR-28: backdating window capped at the leave-year start; a closed
    year is never touched."""
    if leave_year.is_closed:
        raise AppError("CLOSED_YEAR", "This leave year is closed and can no longer be modified.")
    window_days = config_service.get(db, "backdating.window_days")
    earliest = max(date.today() - timedelta(days=window_days), leave_year.start_date)
    if start_date < earliest:
        raise AppError("BACKDATING_WINDOW_EXCEEDED", f"The earliest backdated start date allowed is {earliest.isoformat()}.")
