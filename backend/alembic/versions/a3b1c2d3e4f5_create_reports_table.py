"""Create reports table

Revision ID: a3b1c2d3e4f5
Revises: 8d43f5715ef5
Create Date: 2026-04-08 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a3b1c2d3e4f5'
down_revision: Union[str, None] = '8d43f5715ef5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('reports',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('generated_by', sa.UUID(), nullable=False),
    sa.Column('target_user_id', sa.UUID(), nullable=True),
    sa.Column('date_from', sa.Date(), nullable=False),
    sa.Column('date_to', sa.Date(), nullable=False),
    sa.Column('report_type', sa.String(length=20), nullable=False),
    sa.Column('format', sa.String(length=5), nullable=False),
    sa.Column('file_path', sa.String(length=500), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_generated_by'), 'reports', ['generated_by'], unique=False)
    op.create_index(op.f('ix_reports_target_user_id'), 'reports', ['target_user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_reports_target_user_id'), table_name='reports')
    op.drop_index(op.f('ix_reports_generated_by'), table_name='reports')
    op.drop_table('reports')
