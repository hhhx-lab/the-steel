"""create MVP schema

Revision ID: 202605270001
Revises:
Create Date: 2026-05-27 23:10:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "202605270001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("user_id", sa.String(length=64), primary_key=True),
        sa.Column("nickname", sa.String(length=100), nullable=False),
        sa.Column("experience_level", sa.String(length=32), nullable=False),
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False),
        sa.Column("allow_body_photo_analysis", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "equipment",
        sa.Column("equipment_id", sa.String(length=64), primary_key=True),
        sa.Column("name_cn", sa.String(length=120), nullable=False),
        sa.Column("beginner_name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("target_body_parts_beginner", sa.JSON(), nullable=False),
        sa.Column("target_muscles", sa.JSON(), nullable=False),
        sa.Column("beginner_friendly", sa.Boolean(), nullable=False),
        sa.Column("risk_level", sa.String(length=32), nullable=False),
    )
    op.create_table(
        "exercises",
        sa.Column("exercise_id", sa.String(length=64), primary_key=True),
        sa.Column("name_cn", sa.String(length=120), nullable=False),
        sa.Column("equipment_id", sa.String(length=64), sa.ForeignKey("equipment.equipment_id"), nullable=False),
        sa.Column("beginner_explanation", sa.Text(), nullable=False),
        sa.Column("target_body_parts_beginner", sa.JSON(), nullable=False),
        sa.Column("difficulty", sa.String(length=32), nullable=False),
        sa.Column("steps", sa.JSON(), nullable=False),
        sa.Column("setup_tips", sa.JSON(), nullable=False),
        sa.Column("common_mistakes", sa.JSON(), nullable=False),
        sa.Column("safety_notes", sa.JSON(), nullable=False),
        sa.Column("default_sets", sa.Integer(), nullable=False),
        sa.Column("default_reps", sa.String(length=64), nullable=False),
        sa.Column("media_hint", sa.String(length=200), nullable=False),
    )
    op.create_table(
        "workout_plans",
        sa.Column("plan_id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.user_id"), nullable=False),
        sa.Column("plan_type", sa.String(length=64), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("subtitle", sa.String(length=160), nullable=False),
        sa.Column("intensity", sa.String(length=32), nullable=False),
    )
    op.create_table(
        "workout_plan_exercises",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("plan_id", sa.String(length=64), sa.ForeignKey("workout_plans.plan_id"), nullable=False),
        sa.Column("exercise_id", sa.String(length=64), sa.ForeignKey("exercises.exercise_id"), nullable=False),
        sa.Column("sets", sa.Integer(), nullable=False),
        sa.Column("reps", sa.String(length=64), nullable=False),
        sa.Column("weight_strategy", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.UniqueConstraint("plan_id", "exercise_id", name="uq_plan_exercise"),
    )
    op.create_table(
        "workout_sessions",
        sa.Column("session_id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.user_id"), nullable=False),
        sa.Column("plan_id", sa.String(length=64), sa.ForeignKey("workout_plans.plan_id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "set_records",
        sa.Column("record_id", sa.String(length=96), primary_key=True),
        sa.Column("session_id", sa.String(length=64), sa.ForeignKey("workout_sessions.session_id"), nullable=False),
        sa.Column("exercise_id", sa.String(length=64), sa.ForeignKey("exercises.exercise_id"), nullable=False),
        sa.Column("set_index", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("weight_unit", sa.String(length=16), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False),
        sa.Column("rpe_text", sa.String(length=80), nullable=True),
        sa.Column("user_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("set_records")
    op.drop_table("workout_sessions")
    op.drop_table("workout_plan_exercises")
    op.drop_table("workout_plans")
    op.drop_table("exercises")
    op.drop_table("equipment")
    op.drop_table("users")
