from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.provider import AIProvider, WorkoutLogAIOutput
from app.db.models import Exercise
from app.schemas import ParsedWorkoutLogResponse, SetRecordResponse
from app.services.workout_repository import get_exercise_detail

PAIN_KEYWORDS = ("疼", "痛", "不舒服", "旧伤", "拉伤")
SAFETY_WARNING = "如果训练中出现疼痛、不适、旧伤反应或疑似拉伤，请先停止训练，并咨询专业教练或医生。小铁不能替代专业判断。"


def contains_safety_keyword(text: str) -> bool:
    return any(keyword in text for keyword in PAIN_KEYWORDS)


def _exercise_catalog(db: Session) -> list[dict[str, str]]:
    return [
        {
            "exercise_id": item.exercise_id,
            "name_cn": item.name_cn,
            "equipment_id": item.equipment_id,
        }
        for item in db.scalars(select(Exercise).order_by(Exercise.exercise_id))
    ]


def _match_exercise(db: Session, output: WorkoutLogAIOutput, fallback_exercise_id: str) -> Exercise:
    if output.exercise_id:
        candidate = db.get(Exercise, output.exercise_id)
        if candidate is not None:
            return candidate
    by_name = db.scalar(select(Exercise).where(Exercise.name_cn == output.exercise_name))
    if by_name is not None:
        return by_name
    return get_exercise_detail(db, fallback_exercise_id)


def _empty_parse_response(db: Session, *, text: str, fallback_exercise_id: str, reason: str) -> ParsedWorkoutLogResponse:
    exercise = get_exercise_detail(db, fallback_exercise_id)
    safety_warning = SAFETY_WARNING if contains_safety_keyword(text) else None
    return ParsedWorkoutLogResponse(
        exercise_name=exercise.name_cn,
        exercise_id=exercise.exercise_id,
        sets=[],
        need_confirmation=True,
        xiaotie_feedback=reason,
        safety_warning=safety_warning,
    )


def normalize_workout_log_output(
    db: Session,
    output: WorkoutLogAIOutput,
    *,
    text: str,
    session_id: str,
    fallback_exercise_id: str,
) -> ParsedWorkoutLogResponse:
    exercise = _match_exercise(db, output, fallback_exercise_id)
    records: list[SetRecordResponse] = []
    for index, item in enumerate(output.sets, start=1):
        if item.reps <= 0 or item.weight < 0:
            continue
        records.append(
            SetRecordResponse(
                record_id=f"ai_{exercise.exercise_id}_{index}",
                session_id=session_id,
                exercise_id=exercise.exercise_id,
                set_index=item.set_index or index,
                weight=item.weight,
                weight_unit="kg",
                reps=item.reps,
                rpe_text=item.note,
            )
        )

    if not records:
        return _empty_parse_response(
            db,
            text=text,
            fallback_exercise_id=fallback_exercise_id,
            reason="小铁还没能把这句话整理成可保存的组记录，请你手动补一下组数、重量和次数。",
        )

    safety_warning = SAFETY_WARNING if contains_safety_keyword(text) else None
    return ParsedWorkoutLogResponse(
        exercise_name=exercise.name_cn,
        exercise_id=exercise.exercise_id,
        sets=records,
        need_confirmation=True,
        xiaotie_feedback=output.xiaotie_feedback
        or "收到，我先帮你整理好了。保存前请确认重量和次数是否正确。",
        safety_warning=safety_warning,
    )


def parse_workout_log_with_ai(
    db: Session,
    provider: AIProvider,
    *,
    text: str,
    session_id: str,
    fallback_exercise_id: str,
) -> ParsedWorkoutLogResponse:
    try:
        output = provider.parse_workout_log(
            text=text,
            exercise_catalog=_exercise_catalog(db),
            fallback_exercise_id=fallback_exercise_id,
        )
    except Exception:
        return _empty_parse_response(
            db,
            text=text,
            fallback_exercise_id=fallback_exercise_id,
            reason="AI 解析暂时不可用。你可以切到手动记录，小铁仍会帮你保存确认后的记录。",
        )
    return normalize_workout_log_output(
        db,
        output,
        text=text,
        session_id=session_id,
        fallback_exercise_id=fallback_exercise_id,
    )
