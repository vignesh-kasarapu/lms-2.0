"""leave type gender eligibility

Adds a per-leave-type eligibility rule so a type such as Maternity can be restricted to
one gender. Configurable rather than hard-coded on the type code, so HR can add Paternity
and restrict it without a code change.

'ALL' is the default, which keeps every existing type behaving exactly as before.

Revision ID: a1b2c3d4e5f6
Revises: 3cc712630376
Create Date: 2026-10-18
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '3cc712630376'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'leave_types',
        sa.Column('gender_eligibility', sa.String(length=10), nullable=False, server_default='ALL'),
    )
    # Maternity is the one type in the seeded set with a natural restriction; applying it
    # here means an existing database gets the rule without having to be reseeded.
    op.execute("UPDATE leave_types SET gender_eligibility = 'FEMALE' WHERE type_code = 'MATERNITY'")


def downgrade() -> None:
    op.drop_column('leave_types', 'gender_eligibility')
