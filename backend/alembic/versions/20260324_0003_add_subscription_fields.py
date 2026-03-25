"""add subscription fields to users

Revision ID: 20260324_0003
Revises: 20260324_0002
Create Date: 2026-03-24 23:05:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260324_0003"
down_revision = "20260324_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("subscription_plan", sa.Text(), nullable=False, server_default="free"))
        batch_op.add_column(sa.Column("subscription_status", sa.Text(), nullable=False, server_default="inactive"))
        batch_op.add_column(sa.Column("stripe_customer_id", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("stripe_customer_id")
        batch_op.drop_column("subscription_status")
        batch_op.drop_column("subscription_plan")
