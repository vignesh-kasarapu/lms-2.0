from datetime import date

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.mixins import CreatedAtMixin


class SelfApprovalPermission(Base, CreatedAtMixin):
    """At most one ACTIVE grant per employee — MySQL has no partial/filtered unique
    index, so this is enforced in services/self_approval.py, never at the DB layer.
    Always create through that service, never insert this model directly."""

    __tablename__ = "self_approval_permissions"

    self_approval_permission_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"), nullable=False)  # grantee
    granted_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)  # null = open-ended
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
