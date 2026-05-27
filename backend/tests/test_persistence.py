from sqlalchemy import select

from app.db.models import SetRecord
from app.db.session import get_db
from app.main import app


def test_add_exercise_persists_in_today_workout(client):
    add = client.post(
        "/api/workout/add-exercise",
        json={
            "user_id": "user_local_001",
            "plan_id": "plan_beginner_day_1",
            "exercise_id": "ex_seated_row",
        },
    )
    assert add.status_code == 200
    assert add.json()["position"] == 6

    today = client.get("/api/workout/today").json()
    assert any(item["exercise_id"] == "ex_seated_row" for item in today["exercises"])


def test_save_log_persists_records_by_session_and_exercise(client):
    payload = {
        "user_id": "user_local_001",
        "session_id": "session_local_001",
        "records": [
            {
                "record_id": "rec_test_api_1",
                "session_id": "session_local_001",
                "exercise_id": "ex_lat_pulldown",
                "set_index": 1,
                "weight": 20,
                "weight_unit": "kg",
                "reps": 10,
            }
        ],
    }
    response = client.post("/api/workout/log", json=payload)
    assert response.status_code == 200
    assert response.json()["saved"] == 1

    db = next(app.dependency_overrides[get_db]())
    try:
        records = list(
            db.scalars(
                select(SetRecord).where(
                    SetRecord.session_id == "session_local_001",
                    SetRecord.exercise_id == "ex_lat_pulldown",
                )
            )
        )
    finally:
        db.close()
    assert len(records) == 1
    assert records[0].reps == 10
