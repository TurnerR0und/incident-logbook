"""add professional incident fields

Revision ID: c7f8e2a1b9d0
Revises: a1b2c3d4e5f6
Create Date: 2026-03-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c7f8e2a1b9d0"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "incidents",
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )
    op.add_column(
        "incidents",
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "incidents",
        sa.Column("root_cause", sa.String(), nullable=True),
    )
    op.execute(
        "UPDATE incidents SET started_at = created_at WHERE started_at IS NULL"
    )

    op.create_table(
        "incident_comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("incident_id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["incident_id"],
            ["incidents.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_incident_comments_author_id"),
        "incident_comments",
        ["author_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_incident_comments_incident_id"),
        "incident_comments",
        ["incident_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_incident_comments_incident_id"),
        table_name="incident_comments",
    )
    op.drop_index(
        op.f("ix_incident_comments_author_id"),
        table_name="incident_comments",
    )
    op.drop_table("incident_comments")
    op.drop_column("incidents", "root_cause")
    op.drop_column("incidents", "resolved_at")
    op.drop_column("incidents", "started_at")
