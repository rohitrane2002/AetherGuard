"""add oauth fields to users table

Revision ID: c4e8a3f01d92
Revises: f37bf282bacf
Create Date: 2026-04-07 14:08:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e8a3f01d92'
down_revision: Union[str, None] = 'f37bf282bacf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Make password_hash nullable (for OAuth-only users)
        batch_op.alter_column('password_hash', existing_type=sa.Text(), nullable=True)
        # Add OAuth fields
        batch_op.add_column(sa.Column('provider', sa.Text(), nullable=False, server_default='email'))
        batch_op.add_column(sa.Column('avatar_url', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('github_username', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('github_access_token', sa.Text(), nullable=True))



def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('github_access_token')
        batch_op.drop_column('github_username')
        batch_op.drop_column('avatar_url')
        batch_op.drop_column('provider')
        batch_op.alter_column('password_hash', existing_type=sa.Text(), nullable=False)
