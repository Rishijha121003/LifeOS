"""v0.2 smart planning database changes

Revision ID: e7b02_v0_2_smart_planning
Revises: d6faf63c10f5
Create Date: 2026-08-21 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e7b02_v0_2_smart_planning'
down_revision: Union[str, Sequence[str], None] = 'd6faf63c10f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add V0.2 columns to tasks table
    op.add_column('tasks', sa.Column('estimated_duration_minutes', sa.Integer(), server_default='30', nullable=False))
    op.add_column('tasks', sa.Column('rescheduled_from_date', sa.Date(), nullable=True))
    op.add_column('tasks', sa.Column('rescheduled_count', sa.Integer(), server_default='0', nullable=False))

    # 2. Create settings table
    settings_table = op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('value', sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_settings_id'), 'settings', ['id'], unique=False)
    op.create_index(op.f('ix_settings_key'), 'settings', ['key'], unique=True)

    # 3. Seed default day_end_time setting
    op.bulk_insert(
        settings_table,
        [
            {'key': 'day_end_time', 'value': '23:00'}
        ]
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_settings_key'), table_name='settings')
    op.drop_index(op.f('ix_settings_id'), table_name='settings')
    op.drop_table('settings')

    op.drop_column('tasks', 'rescheduled_count')
    op.drop_column('tasks', 'rescheduled_from_date')
    op.drop_column('tasks', 'estimated_duration_minutes')
