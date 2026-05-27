from app.ai.provider import WorkoutLogAIOutput, WorkoutLogSetAIOutput, get_ai_provider
from app.main import app


class WorkoutLogProvider:
    def scan_equipment(self, **kwargs):
        raise NotImplementedError

    def parse_workout_log(self, **kwargs):
        return WorkoutLogAIOutput(
            exercise_name="高位下拉",
            exercise_id="ex_lat_pulldown",
            sets=[
                WorkoutLogSetAIOutput(set_index=1, weight=20, reps=10),
                WorkoutLogSetAIOutput(set_index=2, weight=20, reps=8, note="有点累"),
            ],
            xiaotie_feedback="收到，我帮你整理好了。",
        )


class EmptyWorkoutLogProvider:
    def scan_equipment(self, **kwargs):
        raise NotImplementedError

    def parse_workout_log(self, **kwargs):
        return WorkoutLogAIOutput(
            exercise_name="未知动作",
            exercise_id=None,
            sets=[],
            xiaotie_feedback="需要用户补充。",
        )


def test_parse_workout_log_returns_confirmation_sets(client):
    app.dependency_overrides[get_ai_provider] = lambda: WorkoutLogProvider()
    response = client.post(
        "/api/workout/log/parse",
        json={
            "user_id": "user_local_001",
            "session_id": "session_local_001",
            "exercise_id": "ex_lat_pulldown",
            "text": "高位下拉做了两组，20公斤，10、8",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["need_confirmation"] is True
    assert len(body["sets"]) == 2
    assert body["sets"][0]["exercise_id"] == "ex_lat_pulldown"


def test_parse_workout_log_safety_warning_does_not_diagnose(client):
    app.dependency_overrides[get_ai_provider] = lambda: WorkoutLogProvider()
    response = client.post(
        "/api/workout/log/parse",
        json={
            "user_id": "user_local_001",
            "session_id": "session_local_001",
            "exercise_id": "ex_lat_pulldown",
            "text": "高位下拉做了两组，但是肩膀疼，像旧伤不舒服",
        },
    )
    assert response.status_code == 200
    warning = response.json()["safety_warning"]
    assert "停止训练" in warning
    assert "诊断" not in warning


def test_parse_workout_log_empty_ai_output_requires_user_correction(client):
    app.dependency_overrides[get_ai_provider] = lambda: EmptyWorkoutLogProvider()
    response = client.post(
        "/api/workout/log/parse",
        json={
            "user_id": "user_local_001",
            "session_id": "session_local_001",
            "exercise_id": "ex_lat_pulldown",
            "text": "刚刚练了一下",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["need_confirmation"] is True
    assert body["sets"] == []
    assert body["exercise_id"] == "ex_lat_pulldown"
