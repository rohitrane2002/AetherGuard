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
    # Make password_hash nullable (for OAuth-only users)
    op.alter_column('users', 'password_hash', existing_type=sa.Text(), nullable=True)

    # Add OAuth fields
    op.add_column('users', sa.Column('provider', sa.Text(), nullable=False, server_default='email'))
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('github_username', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('github_access_token', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'github_access_token')
    op.drop_column('users', 'github_username')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'provider')
    op.alter_column('users', 'password_hash', existing_type=sa.Text(), nullable=False)
