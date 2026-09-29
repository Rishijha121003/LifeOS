from datetime import date
import pytest


def test_daily_reviews_api_and_actual_stats(client):
    today_str = "2026-08-21"
    today_date = date(2026, 8, 21)

    # Create task due today and completed
    t1 = client.post("/api/v1/tasks/", json={
        "title": "Finished Task Today",
        "due_date": today_str,
        "priority": "high"
    }).json()["id"]
    client.patch(f"/api/v1/tasks/{t1}/complete")

    # Create task rescheduled today
    t2 = client.post("/api/v1/tasks/", json={
        "title": "Postponed Task Today",
        "due_date": today_str,
        "priority": "medium"
    }).json()["id"]
    client.post("/api/v1/planning/apply", json={
        "reschedule_task_ids": [t2],
        "target_date": "2026-08-22"
    })

    # 1. Check summary endpoint before submitting review
    summary_res = client.get(f"/api/v1/reviews/summary?target_date={today_str}")
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert sum_data["actual_completed_tasks_count"] == 1
    assert sum_data["actual_rescheduled_tasks_count"] == 1
    assert sum_data["existing_review"] is None

    # 2. Submit review with invalid rating (6 > 5) -> 422 Unprocessable Entity
    invalid_res = client.post("/api/v1/reviews/", json={
        "review_date": today_str,
        "productivity_rating": 6,
        "notes": "Invalid"
    })
    assert invalid_res.status_code == 422

    # 3. Submit valid review
    review_res = client.post("/api/v1/reviews/", json={
        "review_date": today_str,
        "productivity_rating": 4,
        "notes": "Great focus session tonight!"
    })
    assert review_res.status_code == 201
    rev_data = review_res.json()
    assert rev_data["productivity_rating"] == 4
    assert rev_data["completed_tasks_count"] == 1
    assert rev_data["rescheduled_tasks_count"] == 1

    # 4. Idempotent update via POST with same date
    update_res = client.post("/api/v1/reviews/", json={
        "review_date": today_str,
        "productivity_rating": 5,
        "notes": "Updated reflection notes"
    })
    assert update_res.status_code == 201
    assert update_res.json()["productivity_rating"] == 5

    # 5. Get review by date
    get_res = client.get(f"/api/v1/reviews/{today_str}")
    assert get_res.status_code == 200
    assert get_res.json()["notes"] == "Updated reflection notes"

    # 6. Check missing date 404
    assert client.get("/api/v1/reviews/2099-01-01").status_code == 404
