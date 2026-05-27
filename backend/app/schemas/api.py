from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ExperienceLevel = Literal["newbie", "beginner", "intermediate"]
EquipmentCategory = Literal["machine", "cable", "free_weight", "cardio"]
RiskLevel = Literal["low", "medium", "high"]
Difficulty = Literal["beginner", "intermediate", "advanced"]
WorkoutStatus = Literal["pending", "current", "completed", "skipped"]
WeightStrategy = Literal["trial_based"]


class UserProfileResponse(BaseModel):
    user_id: str
    nickname: str
    experience_level: ExperienceLevel
    onboarding_completed: bool
    allow_body_photo_analysis: bool

    model_config = ConfigDict(from_attributes=True)


class EquipmentResponse(BaseModel):
    equipment_id: str
    name_cn: str
    beginner_name: str
    category: EquipmentCategory
    target_body_parts_beginner: list[str]
    target_muscles: list[str]
    beginner_friendly: bool
    risk_level: RiskLevel

    model_config = ConfigDict(from_attributes=True)


class ExerciseResponse(BaseModel):
    exercise_id: str
    name_cn: str
    equipment_id: str
    beginner_explanation: str
    target_body_parts_beginner: list[str]
    difficulty: Difficulty
    steps: list[str]
    setup_tips: list[str]
    common_mistakes: list[str]
    safety_notes: list[str]
    default_sets: int
    default_reps: str
    media_hint: str

    model_config = ConfigDict(from_attributes=True)


class WorkoutPlanExerciseResponse(BaseModel):
    exercise_id: str
    sets: int
    reps: str
    weight_strategy: WeightStrategy
    status: WorkoutStatus

    model_config = ConfigDict(from_attributes=True)


class WorkoutPlanResponse(BaseModel):
    plan_id: str
    user_id: str
    plan_type: Literal["full_body_beginner"]
    duration_minutes: int
    title: str
    subtitle: str
    intensity: RiskLevel
    exercises: list[WorkoutPlanExerciseResponse]

    model_config = ConfigDict(from_attributes=True)


class TodayRecommendationResponse(BaseModel):
    recommended: bool
    reason: str
    suggested_sets: int
    suggested_reps: str


class RecommendedExerciseResponse(BaseModel):
    exercise_id: str
    name_cn: str
    difficulty: Difficulty


class ScanResultResponse(BaseModel):
    recognized: bool
    confidence: float = Field(ge=0, le=1)
    equipment: EquipmentResponse
    target_body_parts_beginner: list[str]
    target_muscles: list[str]
    beginner_friendly: bool
    risk_level: RiskLevel
    recommended_exercises: list[RecommendedExerciseResponse]
    today_recommendation: TodayRecommendationResponse
    user_facing_summary: str
    need_more_photo: bool


class SetRecordResponse(BaseModel):
    record_id: str
    session_id: str
    exercise_id: str
    set_index: int
    weight: float
    weight_unit: Literal["kg"] = "kg"
    reps: int
    rpe_text: str | None = None
    user_note: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ParsedWorkoutLogResponse(BaseModel):
    exercise_name: str
    exercise_id: str
    sets: list[SetRecordResponse]
    need_confirmation: bool
    xiaotie_feedback: str
    safety_warning: str | None = None


class AddExerciseRequest(BaseModel):
    user_id: str
    plan_id: str
    exercise_id: str


class AddExerciseResponse(BaseModel):
    plan_id: str
    exercise_id: str
    position: int
    message: str


class ParseWorkoutLogRequest(BaseModel):
    user_id: str
    session_id: str
    exercise_id: str
    text: str


class SaveWorkoutLogRequest(BaseModel):
    user_id: str
    session_id: str
    records: list[SetRecordResponse]


class SaveWorkoutLogResponse(BaseModel):
    success: bool
    saved: int
    message: str


class ScanUrlRequest(BaseModel):
    image_url: str
    user_id: str
    today_plan_id: str


class ErrorResponse(BaseModel):
    detail: str
    code: str
