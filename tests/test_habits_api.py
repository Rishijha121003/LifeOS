from datetime import date, timedelta
import pytest
from app.services.habit_service import calculate_habit_streaks


def test_calculate_habit_streaks_logic():
    today = date(2026, 8, 21)
    dates = [
        date(2026, 8, 15),
        date(2026, 8, 16),
        date(2026, 8, 17),  # 3-day streak
        date(2026, 8, 20),
        date(2026, 8, 21),  # 2-day current streak
    ]

    curr, best = calculate_habit_streaks(dates, reference_date=today)
    assert curr == 2
    assert best == 3


def test_habits_crud_api(client):
    # 1. Create habit
    create_res = client.post("/api/v1/habits/", json={
        "title": "FastAPI Testing",
        "description": "Write API tests daily",
        "frequency_type": "daily",
        "target_days_per_week": 7,
        "priority": "high"
    })
    assert create_res.status_code == 201
    habit_data = create_res.json()
    habit_id = habit_data["id"]
    assert habit_data["title"] == "FastAPI Testing"

    # 2. List habits
    list_res = client.get("/api/v1/habits/")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Log completion
    today_str = "2026-08-21"
    log_res = client.post(f"/api/v1/habits/{habit_id}/log", json={"completed_date": today_str})
    assert log_res.status_code == 201
    assert log_res.json()["completed_date"] == today_str

    # 4. Duplicate completion test (idempotent 201)
    dup_res = client.post(f"/api/v1/habits/{habit_id}/log", json={"completed_date": today_str})
    assert dup_res.status_code == 201

    # 5. Get habit details
    detail_res = client.get(f"/api/v1/habits/{habit_id}")
    assert detail_res.status_code == 200
    details = detail_res.json()
    assert details["total_completions"] == 1

    # 6. Update habit
    patch_res = client.patch(f"/api/v1/habits/{habit_id}", json={"archived": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["archived"] is True

    # 7. Delete habit
    del_res = client.delete(f"/api/v1/habits/{habit_id}")
    assert del_res.status_code == 204

    # Verify 404 missing
    get_missing = client.get(f"/api/v1/habits/{habit_id}")
    assert get_missing.status_code == 404
