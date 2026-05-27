from base64 import b64encode
from typing import Protocol

from openai import OpenAI
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings


class EquipmentScanAIOutput(BaseModel):
    recognized: bool
    confidence: float = Field(ge=0, le=1)
    equipment_id: str | None = None
    equipment_name: str | None = None
    user_facing_summary: str


class WorkoutLogSetAIOutput(BaseModel):
    set_index: int
    weight: float
    reps: int
    note: str | None = None


class WorkoutLogAIOutput(BaseModel):
    exercise_name: str
    exercise_id: str | None = None
    sets: list[WorkoutLogSetAIOutput]
    xiaotie_feedback: str


class AIProvider(Protocol):
    def scan_equipment(
        self,
        *,
        image_url: str | None,
        image_bytes: bytes | None,
        mime_type: str | None,
        equipment_catalog: list[dict[str, object]],
    ) -> EquipmentScanAIOutput:
        ...

    def parse_workout_log(
        self,
        *,
        text: str,
        exercise_catalog: list[dict[str, object]],
        fallback_exercise_id: str,
    ) -> WorkoutLogAIOutput:
        ...


class OpenAIProvider:
    def __init__(self, settings: Settings):
        self.settings = settings

    def _client(self) -> OpenAI:
        self.settings.require_real_ai_config()
        return OpenAI(
            api_key=self.settings.openai_api_key,
            timeout=self.settings.ai_request_timeout_seconds,
        )

    def scan_equipment(
        self,
        *,
        image_url: str | None,
        image_bytes: bytes | None,
        mime_type: str | None,
        equipment_catalog: list[dict[str, object]],
    ) -> EquipmentScanAIOutput:
        image_ref = image_url
        if image_bytes is not None:
            media_type = mime_type or "image/jpeg"
            image_ref = f"data:{media_type};base64,{b64encode(image_bytes).decode('ascii')}"
        if not image_ref:
            raise ValueError("image_url or image_bytes is required")

        response = self._client().responses.parse(
            model=self.settings.openai_model,
            text_format=EquipmentScanAIOutput,
            instructions=(
                "你是健身房器械识别助手。只根据图片判断器械，"
                "从给定 catalog 里选择最接近的 equipment_id。"
                "如果不确定，recognized=false 且 confidence 低于 0.65。"
                "不要做医学诊断，不要承诺绝对训练效果。"
            ),
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": f"equipment_catalog={equipment_catalog}"},
                        {"type": "input_image", "image_url": image_ref},
                    ],
                }
            ],
        )
        parsed = getattr(response, "output_parsed", None)
        if parsed is None:
            raise ValueError("AI scan response did not include parsed output")
        return parsed

    def parse_workout_log(
        self,
        *,
        text: str,
        exercise_catalog: list[dict[str, object]],
        fallback_exercise_id: str,
    ) -> WorkoutLogAIOutput:
        response = self._client().responses.parse(
            model=self.settings.openai_model,
            text_format=WorkoutLogAIOutput,
            instructions=(
                "你是小铁，负责把用户的一句话训练记录解析为结构化组记录。"
                "必须从 catalog 中匹配 exercise_id；如果不确定，使用 fallback_exercise_id。"
                "只提取组数、重量、次数和简短感受，不做医学诊断。"
            ),
            input=(
                f"fallback_exercise_id={fallback_exercise_id}\n"
                f"exercise_catalog={exercise_catalog}\n"
                f"user_text={text}"
            ),
        )
        parsed = getattr(response, "output_parsed", None)
        if parsed is None:
            raise ValueError("AI workout log response did not include parsed output")
        return parsed


def get_ai_provider() -> AIProvider:
    return OpenAIProvider(get_settings())
