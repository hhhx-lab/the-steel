from app.ai.provider import EquipmentScanAIOutput, get_ai_provider
from app.main import app


class HighConfidenceScanProvider:
    def scan_equipment(self, *, image_url, image_bytes, mime_type, equipment_catalog):
        return EquipmentScanAIOutput(
            recognized=True,
            confidence=0.92,
            equipment_id="eq_lat_pulldown",
            user_facing_summary="这是高位下拉器，适合新手先用轻重量练背。",
        )

    def parse_workout_log(self, **kwargs):
        raise NotImplementedError


class LowConfidenceScanProvider:
    def scan_equipment(self, **kwargs):
        return EquipmentScanAIOutput(
            recognized=False,
            confidence=0.48,
            user_facing_summary="不确定",
        )

    def parse_workout_log(self, **kwargs):
        raise NotImplementedError


def test_scan_json_high_confidence_returns_catalog_result(client):
    app.dependency_overrides[get_ai_provider] = lambda: HighConfidenceScanProvider()
    response = client.post(
        "/api/equipment/scan",
        json={
            "image_url": "https://example.com/equipment.jpg",
            "user_id": "user_local_001",
            "today_plan_id": "plan_beginner_day_1",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["recognized"] is True
    assert body["equipment"]["equipment_id"] == "eq_lat_pulldown"
    assert body["recommended_exercises"][0]["exercise_id"] == "ex_lat_pulldown"
    assert body["need_more_photo"] is False


def test_scan_multipart_low_confidence_requests_more_photo(client):
    app.dependency_overrides[get_ai_provider] = lambda: LowConfidenceScanProvider()
    response = client.post(
        "/api/equipment/scan",
        files={"image": ("equipment.jpg", b"fake", "image/jpeg")},
        data={"user_id": "user_local_001", "today_plan_id": "plan_beginner_day_1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["recognized"] is False
    assert body["need_more_photo"] is True
    assert body["recommended_exercises"] == []
