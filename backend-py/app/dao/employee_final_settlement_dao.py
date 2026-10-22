from sqlalchemy.orm import Session

from app.models.employee_extras import EmployeeFinalSettlement


def create(db: Session, **fields) -> EmployeeFinalSettlement:
    row = EmployeeFinalSettlement(**fields)
    db.add(row)
    db.flush()
    return row
