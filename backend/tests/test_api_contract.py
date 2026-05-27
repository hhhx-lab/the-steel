def test_read_endpoints_return_frontend_contracts(client):
    profile = client.get("/api/user/profile")
    assert profile.status_code == 200
    assert set(profile.json()) == {
        "user_id",
        "nickname",
        "experience_level",
        "onboarding_completed",
        "allow_body_photo_analysis",
    }

    today = client.get("/api/workout/today")
    assert today.status_code == 200
    body = today.json()
    assert body["plan_id"] == "plan_beginner_day_1"
    assert body["user_id"] == "user_local_001"
    assert len(body["exercises"]) == 5

    exercise = client.get("/api/exercises/ex_lat_pulldown")
    assert exercise.status_code == 200
    assert exercise.json()["name_cn"] == "高位下拉"


def test_unknown_exercise_returns_controlled_404(client):
    response = client.get("/api/exercises/not_here")
    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
