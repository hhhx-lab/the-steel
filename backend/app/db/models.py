from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    nickname: Mapped[str] = mapped_column(String(100), nullable=False)
    experience_level: Mapped[str] = mapped_column(String(32), nullable=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    allow_body_photo_analysis: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    plans: Mapped[list["WorkoutPlan"]] = relationship(back_populates="user")


class Equipment(Base):
    __tablename__ = "equipment"

    equipment_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name_cn: Mapped[str] = mapped_column(String(120), nullable=False)
    beginner_name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    target_body_parts_beginner: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    target_muscles: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    beginner_friendly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    risk_level: Mapped[str] = mapped_column(String(32), nullable=False)

    exercises: Mapped[list["Exercise"]] = relationship(back_populates="equipment")


class Exercise(Base):
    __tablename__ = "exercises"

    exercise_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name_cn: Mapped[str] = mapped_column(String(120), nullable=False)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), nullable=False)
    beginner_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    target_body_parts_beginner: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False)
    steps: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    setup_tips: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    common_mistakes: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    safety_notes: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    default_sets: Mapped[int] = mapped_column(Integer, nullable=False)
    default_reps: Mapped[str] = mapped_column(String(64), nullable=False)
    media_hint: Mapped[str] = mapped_column(String(200), nullable=False)

    equipment: Mapped[Equipment] = relationship(back_populates="exercises")
    plan_links: Mapped[list["WorkoutPlanExercise"]] = relationship(back_populates="exercise")
    records: Mapped[list["SetRecord"]] = relationship(back_populates="exercise")


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    plan_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    plan_type: Mapped[str] = mapped_column(String(64), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    subtitle: Mapped[str] = mapped_column(String(160), nullable=False)
    intensity: Mapped[str] = mapped_column(String(32), nullable=False)

    user: Mapped[User] = relationship(back_populates="plans")
    exercises: Mapped[list["WorkoutPlanExercise"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="WorkoutPlanExercise.position",
    )
    sessions: Mapped[list["WorkoutSession"]] = relationship(back_populates="plan")


class WorkoutPlanExercise(Base):
    __tablename__ = "workout_plan_exercises"
    __table_args__ = (UniqueConstraint("plan_id", "exercise_id", name="uq_plan_exercise"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[str] = mapped_column(ForeignKey("workout_plans.plan_id"), nullable=False)
    exercise_id: Mapped[str] = mapped_column(ForeignKey("exercises.exercise_id"), nullable=False)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[str] = mapped_column(String(64), nullable=False)
    weight_strategy: Mapped[str] = mapped_column(String(64), nullable=False, default="trial_based")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    position: Mapped[int] = mapped_column(Integer, nullable=False)

    plan: Mapped[WorkoutPlan] = relationship(back_populates="exercises")
    exercise: Mapped[Exercise] = relationship(back_populates="plan_links")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    session_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    plan_id: Mapped[str] = mapped_column(ForeignKey("workout_plans.plan_id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="in_progress")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    plan: Mapped[WorkoutPlan] = relationship(back_populates="sessions")
    records: Mapped[list["SetRecord"]] = relationship(back_populates="session")


class SetRecord(Base):
    __tablename__ = "set_records"

    record_id: Mapped[str] = mapped_column(String(96), primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("workout_sessions.session_id"), nullable=False)
    exercise_id: Mapped[str] = mapped_column(ForeignKey("exercises.exercise_id"), nullable=False)
    set_index: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    weight_unit: Mapped[str] = mapped_column(String(16), nullable=False, default="kg")
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rpe_text: Mapped[str | None] = mapped_column(String(80), nullable=True)
    user_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    session: Mapped[WorkoutSession] = relationship(back_populates="records")
    exercise: Mapped[Exercise] = relationship(back_populates="records")
