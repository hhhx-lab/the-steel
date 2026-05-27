from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.ai.provider import AIProvider, get_ai_provider
from app.db.session import get_db
from app.schemas import (
    AddExerciseRequest,
    AddExerciseResponse,
    ExerciseResponse,
    SaveWorkoutLogRequest,
    SaveWorkoutLogResponse,
    ScanResultResponse,
    UserProfileResponse,
    WorkoutPlanResponse,
)
from app.services.ai_normalization import scan_equipment_with_ai
from app.services.workout_repository import (
    add_exercise_to_plan,
    get_exercise_detail,
    get_set_records,
    get_today_workout,
    get_user_profile,
    save_set_records,
)

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


@router.post("/api/equipment/scan", response_model=ScanResultResponse, tags=["equipment"])
async def scan_equipment(
    request: Request,
    db: Session = Depends(get_db),
    provider: AIProvider = Depends(get_ai_provider),
):
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        upload = form.get("image")
        image_bytes = await upload.read() if hasattr(upload, "read") else None
        mime_type = getattr(upload, "content_type", None)
        return scan_equipment_with_ai(db, provider, image_bytes=image_bytes, mime_type=mime_type)

    body = await request.json()
    return scan_equipment_with_ai(db, provider, image_url=body.get("image_url"))


@router.post("/api/workout/add-exercise", response_model=AddExerciseResponse, tags=["workout"])
def add_exercise(payload: AddExerciseRequest, db: Session = Depends(get_db)):
    link = add_exercise_to_plan(
        db,
        user_id=payload.user_id,
        plan_id=payload.plan_id,
        exercise_id=payload.exercise_id,
    )
    return AddExerciseResponse(
        plan_id=link.plan_id,
        exercise_id=link.exercise_id,
        position=link.position,
        message="已加入今日训练，小铁会按顺序带你练。",
    )


@router.post("/api/workout/log", response_model=SaveWorkoutLogResponse, tags=["workout"])
def save_workout_log(payload: SaveWorkoutLogRequest, db: Session = Depends(get_db)):
    saved = save_set_records(
        db,
        user_id=payload.user_id,
        session_id=payload.session_id,
        records=[record.model_dump() for record in payload.records],
    )
    exercise_id = saved[0].exercise_id if saved else ""
    persisted = get_set_records(db, session_id=payload.session_id, exercise_id=exercise_id)
    return SaveWorkoutLogResponse(
        success=True,
        saved=len(saved),
        message=f"收到，我帮你记好了。当前动作已保存 {len(persisted)} 组记录。",
    )
