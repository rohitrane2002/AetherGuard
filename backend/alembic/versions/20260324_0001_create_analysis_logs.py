"""create analysis logs table

Revision ID: 20260324_0001
Revises: 
Create Date: 2026-03-24 22:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260324_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analysis_logs",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_email", sa.Text(), nullable=False),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("prediction", sa.Text(), nullable=False),
        sa.Column("prob_secure", sa.Float(), nullable=False),
        sa.Column("prob_vulnerable", sa.Float(), nullable=False),
        sa.Column("model_source", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_analysis_logs_id", "analysis_logs", ["id"], unique=False)
    op.create_index("ix_analysis_logs_prediction", "analysis_logs", ["prediction"], unique=False)
    op.create_index("ix_analysis_logs_user_email", "analysis_logs", ["user_email"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_analysis_logs_user_email", table_name="analysis_logs")
    op.drop_index("ix_analysis_logs_prediction", table_name="analysis_logs")
    op.drop_index("ix_analysis_logs_id", table_name="analysis_logs")
    op.drop_table("analysis_logs")
