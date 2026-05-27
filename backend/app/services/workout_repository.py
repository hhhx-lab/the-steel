from collections.abc import Mapping, Sequence
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Equipment, Exercise, SetRecord, User, WorkoutPlan, WorkoutPlanExercise, WorkoutSession
from app.db.seed import DEFAULT_PLAN_ID, DEFAULT_SESSION_ID, DEFAULT_USER_ID
from app.services.errors import NotFoundError, ValidationError


def get_user_profile(db: Session, user_id: str = DEFAULT_USER_ID) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise NotFoundError("user", user_id)
    return user


def get_today_workout(db: Session, user_id: str = DEFAULT_USER_ID) -> WorkoutPlan:
    plan = db.scalar(
        select(WorkoutPlan)
        .where(WorkoutPlan.user_id == user_id, WorkoutPlan.plan_id == DEFAULT_PLAN_ID)
        .options(selectinload(WorkoutPlan.exercises).selectinload(WorkoutPlanExercise.exercise))
    )
    if plan is None:
        raise NotFoundError("workout_plan", DEFAULT_PLAN_ID)
    return plan


def get_exercise_detail(db: Session, exercise_id: str) -> Exercise:
    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise NotFoundError("exercise", exercise_id)
    return exercise


def get_equipment(db: Session, equipment_id: str) -> Equipment:
    equipment = db.get(Equipment, equipment_id)
    if equipment is None:
        raise NotFoundError("equipment", equipment_id)
    return equipment


def find_equipment_by_name_or_id(db: Session, value: str) -> Equipment | None:
    normalized = value.strip()
    if not normalized:
        return None
    return db.scalar(
        select(Equipment).where(
            (Equipment.equipment_id == normalized)
            | (Equipment.name_cn == normalized)
            | (Equipment.beginner_name == normalized)
        )
    )


def find_primary_exercise_for_equipment(db: Session, equipment_id: str) -> Exercise | None:
    return db.scalar(
        select(Exercise)
        .where(Exercise.equipment_id == equipment_id)
        .order_by(Exercise.exercise_id)
    )


def add_exercise_to_plan(
    db: Session,
    *,
    user_id: str,
    plan_id: str,
    exercise_id: str,
) -> WorkoutPlanExercise:
    plan = db.scalar(select(WorkoutPlan).where(WorkoutPlan.user_id == user_id, WorkoutPlan.plan_id == plan_id))
    if plan is None:
        raise NotFoundError("workout_plan", plan_id)
    exercise = get_exercise_detail(db, exercise_id)
    existing = db.scalar(
        select(WorkoutPlanExercise).where(
            WorkoutPlanExercise.plan_id == plan_id,
            WorkoutPlanExercise.exercise_id == exercise_id,
        )
    )
    if existing is not None:
        return existing

    position = (
        db.scalar(select(func.max(WorkoutPlanExercise.position)).where(WorkoutPlanExercise.plan_id == plan_id))
        or 0
    ) + 1
    link = WorkoutPlanExercise(
        plan_id=plan_id,
        exercise_id=exercise_id,
        sets=exercise.default_sets,
        reps=exercise.default_reps,
        weight_strategy="trial_based",
        status="pending",
        position=position,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def get_or_create_session(
    db: Session,
    *,
    user_id: str = DEFAULT_USER_ID,
    plan_id: str = DEFAULT_PLAN_ID,
    session_id: str = DEFAULT_SESSION_ID,
) -> WorkoutSession:
    session = db.get(WorkoutSession, session_id)
    if session is not None:
        return session
    get_user_profile(db, user_id)
    if db.get(WorkoutPlan, plan_id) is None:
        raise NotFoundError("workout_plan", plan_id)
    session = WorkoutSession(session_id=session_id, user_id=user_id, plan_id=plan_id, status="in_progress")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def save_set_records(
    db: Session,
    *,
    user_id: str,
    session_id: str,
    records: Sequence[Mapping[str, object]],
) -> list[SetRecord]:
    if not records:
        raise ValidationError("records must not be empty")
    session = get_or_create_session(db, user_id=user_id, session_id=session_id)
    saved: list[SetRecord] = []
    for record in records:
        exercise_id = str(record.get("exercise_id") or "")
        get_exercise_detail(db, exercise_id)
        model = SetRecord(
            record_id=str(record.get("record_id") or f"rec_{uuid4().hex}"),
            session_id=session.session_id,
            exercise_id=exercise_id,
            set_index=int(record.get("set_index") or len(saved) + 1),
            weight=float(record.get("weight") or 0),
            weight_unit=str(record.get("weight_unit") or "kg"),
            reps=int(record.get("reps") or 0),
            rpe_text=record.get("rpe_text") if isinstance(record.get("rpe_text"), str) else None,
            user_note=record.get("user_note") if isinstance(record.get("user_note"), str) else None,
        )
        db.merge(model)
        saved.append(model)
    db.commit()
    return saved


def get_set_records(db: Session, *, session_id: str, exercise_id: str) -> list[SetRecord]:
    return list(
        db.scalars(
            select(SetRecord)
            .where(SetRecord.session_id == session_id, SetRecord.exercise_id == exercise_id)
            .order_by(SetRecord.set_index)
        )
    )
