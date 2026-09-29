from datetime import date
import pytest


def test_analytics_api_empty_and_populated(client):
    today_str = "2026-08-21"

    # 1. Empty dataset analytics request
    empty_res = client.get(f"/api/v1/analytics/summary?reference_date={today_str}")
    assert empty_res.status_code == 200
    data = empty_res.json()
    assert data["reference_date"] == today_str
    assert data["completion_rates"]["rate_7_days"] == 0.0
    assert data["habit_consistency"]["active_habits"] == 0
    assert data["goal_progress"]["active_goals"] == 0

    # 2. Add habit
    h_res = client.post("/api/v1/habits/", json={
        "title": "Daily DSA",
        "priority": "high"
    }).json()["id"]
    client.post(f"/api/v1/habits/{h_res}/log", json={"completed_date": today_str})

    # 3. Add goal with milestone
    g_res = client.post("/api/v1/goals/", json={
        "title": "Learn AI Engineering",
        "milestones": [{"title": "Read Paper"}]
    }).json()["id"]

    # 4. Add task rescheduled 3 times (triggers repeated postponement insight)
    t_res = client.post("/api/v1/tasks/", json={
        "title": "Postponed Tech Task",
        "due_date": today_str,
        "priority": "high",
        "estimated_duration_minutes": 120
    }).json()["id"]
    
    # Simulate 3 postponements via apply API
    for d in ["2026-08-22", "2026-08-23", "2026-08-24"]:
        apply_res = client.post("/api/v1/planning/apply", json={
            "reschedule_task_ids": [t_res],
            "target_date": d
        })
        assert apply_res.status_code == 200

    # 5. Fetch analytics summary
    analytics_res = client.get(f"/api/v1/analytics/summary?reference_date={today_str}")
    assert analytics_res.status_code == 200
    summary = analytics_res.json()
    assert summary["habit_consistency"]["active_habits"] == 1
    assert summary["goal_progress"]["active_goals"] == 1

    # Verify deterministic insight triggered
    insight_ids = [i["id"] for i in summary["insights"]]
    assert "repeat_postponement_warning" in insight_ids
