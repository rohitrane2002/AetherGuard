"""add_growth_pages_and_is_pro

Revision ID: a1a1a1a1a1a1
Revises: c4e8a3f01d92
Create Date: 2026-04-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1a1a1a1a1a1'
down_revision: Union[str, None] = 'c4e8a3f01d92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # GrowthPages table
    op.create_table('growth_pages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.Text(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('meta_description', sa.Text(), nullable=False),
        sa.Column('content_html', sa.Text(), nullable=False),
        sa.Column('category', sa.Text(), nullable=False),
        sa.Column('keywords', sa.Text(), nullable=True),
        sa.Column('author_ai_name', sa.Text(), server_default='AetherGuard SEO', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_growth_pages_category'), 'growth_pages', ['category'], unique=False)
    op.create_index(op.f('ix_growth_pages_id'), 'growth_pages', ['id'], unique=False)
    op.create_index(op.f('ix_growth_pages_slug'), 'growth_pages', ['slug'], unique=True)
    
    # Add is_pro to users
    op.add_column('users', sa.Column('is_pro', sa.Boolean(), server_default='0', nullable=False))

def downgrade() -> None:
    op.drop_column('users', 'is_pro')
    op.drop_index(op.f('ix_growth_pages_slug'), table_name='growth_pages')
    op.drop_index(op.f('ix_growth_pages_id'), table_name='growth_pages')
    op.drop_index(op.f('ix_growth_pages_category'), table_name='growth_pages')
    op.drop_table('growth_pages')
