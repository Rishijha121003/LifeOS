"""v0.3 habits goals and daily reviews schema migration

Revision ID: f8c03_v0_3_habits_goals_reviews
Revises: e7b02_v0_2_smart_planning
Create Date: 2026-08-21 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f8c03_v0_3_habits_goals_reviews'
down_revision: Union[str, Sequence[str], None] = 'e7b02_v0_2_smart_planning'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create habits table
    op.create_table(
        'habits',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequency_type', sa.String(length=20), server_default='daily', nullable=False),
        sa.Column('target_days_per_week', sa.Integer(), server_default='7', nullable=False),
        sa.Column('priority', sa.String(length=20), server_default='medium', nullable=False),
        sa.Column('archived', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_habits_id'), 'habits', ['id'], unique=False)
    op.create_index(op.f('ix_habits_archived'), 'habits', ['archived'], unique=False)

    # 2. Create habit_logs table
    op.create_table(
        'habit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('habit_id', sa.Integer(), sa.ForeignKey('habits.id', ondelete='CASCADE'), nullable=False),
        sa.Column('completed_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('habit_id', 'completed_date', name='uq_habit_date')
    )
    op.create_index(op.f('ix_habit_logs_id'), 'habit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_habit_logs_habit_id'), 'habit_logs', ['habit_id'], unique=False)
    op.create_index(op.f('ix_habit_logs_completed_date'), 'habit_logs', ['completed_date'], unique=False)

    # 3. Create goals table
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), server_default='General', nullable=False),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goals_id'), 'goals', ['id'], unique=False)
    op.create_index(op.f('ix_goals_status'), 'goals', ['status'], unique=False)

    # 4. Create goal_milestones table
    op.create_table(
        'goal_milestones',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('goal_id', sa.Integer(), sa.ForeignKey('goals.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('order_index', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goal_milestones_id'), 'goal_milestones', ['id'], unique=False)
    op.create_index(op.f('ix_goal_milestones_goal_id'), 'goal_milestones', ['goal_id'], unique=False)

    # 5. Create daily_reviews table
    op.create_table(
        'daily_reviews',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('review_date', sa.Date(), nullable=False),
        sa.Column('productivity_rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('completed_tasks_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('rescheduled_tasks_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.CheckConstraint('productivity_rating IS NULL OR (productivity_rating >= 1 AND productivity_rating <= 5)', name='check_productivity_rating_range'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_reviews_id'), 'daily_reviews', ['id'], unique=False)
    op.create_index(op.f('ix_daily_reviews_review_date'), 'daily_reviews', ['review_date'], unique=True)

    # 6. Add goal_id foreign key column to tasks table
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('goal_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_tasks_goals_goal_id', 'goals', ['goal_id'], ['id'], ondelete='SET NULL')
        batch_op.create_index(batch_op.f('ix_tasks_goal_id'), ['goal_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_index(batch_op.f('ix_tasks_goal_id'))
        batch_op.drop_constraint('fk_tasks_goals_goal_id', type_='foreignkey')
        batch_op.drop_column('goal_id')

    op.drop_index(op.f('ix_daily_reviews_review_date'), table_name='daily_reviews')
    op.drop_index(op.f('ix_daily_reviews_id'), table_name='daily_reviews')
    op.drop_table('daily_reviews')

    op.drop_index(op.f('ix_goal_milestones_goal_id'), table_name='goal_milestones')
    op.drop_index(op.f('ix_goal_milestones_id'), table_name='goal_milestones')
    op.drop_table('goal_milestones')

    op.drop_index(op.f('ix_goals_status'), table_name='goals')
    op.drop_index(op.f('ix_goals_id'), table_name='goals')
    op.drop_table('goals')

    op.drop_index(op.f('ix_habit_logs_completed_date'), table_name='habit_logs')
    op.drop_index(op.f('ix_habit_logs_habit_id'), table_name='habit_logs')
    op.drop_index(op.f('ix_habit_logs_id'), table_name='habit_logs')
    op.drop_table('habit_logs')

    op.drop_index(op.f('ix_habits_archived'), table_name='habits')
    op.drop_index(op.f('ix_habits_id'), table_name='habits')
    op.drop_table('habits')
