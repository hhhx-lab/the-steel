from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import ExerciseResponse, UserProfileResponse, WorkoutPlanResponse
from app.services.workout_repository import get_exercise_detail, get_today_workout, get_user_profile

router = APIRouter()


@router.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "tiezi-backend"}


@router.get("/api/user/profile", response_model=UserProfileResponse, tags=["user"])
def read_user_profile(db: Session = Depends(get_db)):
    return get_user_profile(db)


@router.get("/api/workout/today", response_model=WorkoutPlanResponse, tags=["workout"])
def read_today_workout(db: Session = Depends(get_db)):
    return get_today_workout(db)


@router.get("/api/exercises/{exercise_id}", response_model=ExerciseResponse, tags=["exercise"])
def read_exercise_detail(exercise_id: str, db: Session = Depends(get_db)):
    return get_exercise_detail(db, exercise_id)
