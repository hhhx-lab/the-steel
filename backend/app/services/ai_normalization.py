from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.provider import AIProvider, EquipmentScanAIOutput
from app.db.models import Equipment
from app.schemas import (
    EquipmentResponse,
    RecommendedExerciseResponse,
    ScanResultResponse,
    TodayRecommendationResponse,
)
from app.services.workout_repository import (
    find_equipment_by_name_or_id,
    find_primary_exercise_for_equipment,
    get_equipment,
)

LOW_CONFIDENCE_THRESHOLD = 0.65


def _equipment_catalog(db: Session) -> list[dict[str, object]]:
    return [
        {
            "equipment_id": item.equipment_id,
            "name_cn": item.name_cn,
            "beginner_name": item.beginner_name,
            "category": item.category,
        }
        for item in db.scalars(select(Equipment).order_by(Equipment.equipment_id))
    ]


def _low_confidence_response(db: Session, *, confidence: float = 0.0, reason: str) -> ScanResultResponse:
    unknown = get_equipment(db, "eq_unknown")
    return ScanResultResponse(
        recognized=False,
        confidence=max(0.0, min(confidence, LOW_CONFIDENCE_THRESHOLD - 0.01)),
        equipment=EquipmentResponse.model_validate(unknown),
        target_body_parts_beginner=[],
        target_muscles=[],
        beginner_friendly=False,
        risk_level="medium",
        recommended_exercises=[],
        today_recommendation=TodayRecommendationResponse(
            recommended=False,
            reason=reason,
            suggested_sets=0,
            suggested_reps="先补拍清楚一点",
        ),
        user_facing_summary=reason,
        need_more_photo=True,
    )


def normalize_scan_output(
    db: Session,
    output: EquipmentScanAIOutput,
) -> ScanResultResponse:
    equipment = None
    if output.equipment_id:
        equipment = find_equipment_by_name_or_id(db, output.equipment_id)
    if equipment is None and output.equipment_name:
        equipment = find_equipment_by_name_or_id(db, output.equipment_name)

    if not output.recognized or output.confidence < LOW_CONFIDENCE_THRESHOLD or equipment is None:
        return _low_confidence_response(
            db,
            confidence=output.confidence,
            reason="这张照片小铁还不太确定。请尽量拍到器械正面、座椅、把手和重量区。",
        )

    exercise = find_primary_exercise_for_equipment(db, equipment.equipment_id)
    recommended = []
    suggested_sets = 0
    suggested_reps = "先看教程再开始"
    if exercise is not None:
        recommended = [
            RecommendedExerciseResponse(
                exercise_id=exercise.exercise_id,
                name_cn=exercise.name_cn,
                difficulty=exercise.difficulty,
            )
        ]
        suggested_sets = exercise.default_sets
        suggested_reps = exercise.default_reps

    return ScanResultResponse(
        recognized=True,
        confidence=output.confidence,
        equipment=EquipmentResponse.model_validate(equipment),
        target_body_parts_beginner=equipment.target_body_parts_beginner,
        target_muscles=equipment.target_muscles,
        beginner_friendly=equipment.beginner_friendly,
        risk_level=equipment.risk_level,
        recommended_exercises=recommended,
        today_recommendation=TodayRecommendationResponse(
            recommended=exercise is not None,
            reason=f"{equipment.beginner_name}适合作为今天的新手训练动作，先用轻重量试动作。",
            suggested_sets=suggested_sets,
            suggested_reps=suggested_reps,
        ),
        user_facing_summary=output.user_facing_summary
        or f"这看起来是{equipment.name_cn}，主要练{','.join(equipment.target_body_parts_beginner)}。",
        need_more_photo=False,
    )


def scan_equipment_with_ai(
    db: Session,
    provider: AIProvider,
    *,
    image_url: str | None = None,
    image_bytes: bytes | None = None,
    mime_type: str | None = None,
) -> ScanResultResponse:
    try:
        output = provider.scan_equipment(
            image_url=image_url,
            image_bytes=image_bytes,
            mime_type=mime_type,
            equipment_catalog=_equipment_catalog(db),
        )
    except Exception:
        return _low_confidence_response(
            db,
            reason="AI 识别暂时不可用。可以稍后再试，或先切回 mock 模式演示流程。",
        )
    return normalize_scan_output(db, output)
