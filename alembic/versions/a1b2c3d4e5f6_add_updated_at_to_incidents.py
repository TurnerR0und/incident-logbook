"""add updated_at to incidents

Revision ID: a1b2c3d4e5f6
Revises: 9053a4aee824
Create Date: 2026-03-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9053a4aee824'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add updated_at column to incidents table."""
    op.add_column(
        'incidents',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        )
    )


def downgrade() -> None:
    """Remove updated_at column from incidents table."""
    op.drop_column('incidents', 'updated_at')
