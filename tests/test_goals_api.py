import pytest
from app.models.task import PriorityEnum


def test_goals_crud_milestones_and_task_linking_api(client):
    # 1. Create task to link later
    task_res = client.post("/api/v1/tasks/", json={
        "title": "System Design Reading",
        "priority": "high",
        "estimated_duration_minutes": 60
    })
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    # 2. Create goal
    goal_res = client.post("/api/v1/goals/", json={
        "title": "Master Backend Systems",
        "description": "Learn DB internals & distributed algorithms",
        "category": "Career",
        "status": "active",
        "milestones": [
            {"title": "Read DDIA Book", "order_index": 1}
        ]
    })
    assert goal_res.status_code == 201
    goal_data = goal_res.json()
    goal_id = goal_data["id"]
    assert goal_data["progress_percentage"] == 0.0

    # 3. Add second milestone
    ms_res = client.post(f"/api/v1/goals/{goal_id}/milestones", json={
        "title": "Build Distributed Cache",
        "order_index": 2
    })
    assert ms_res.status_code == 201
    ms_id = ms_res.json()["id"]

    # 4. Link task to goal
    link_res = client.post(f"/api/v1/goals/{goal_id}/tasks/{task_id}/link")
    assert link_res.status_code == 200
    assert link_res.json()["goal_id"] == goal_id

    # 5. Complete 1 milestone out of 2 milestones
    complete_ms = client.patch(f"/api/v1/goals/milestones/{ms_id}", json={"completed": True})
    assert complete_ms.status_code == 200
    assert complete_ms.json()["completed"] is True

    # 6. Check goal progress (1/2 milestones = 50.0%)
    detail_res = client.get(f"/api/v1/goals/{goal_id}")
    assert detail_res.status_code == 200
    details = detail_res.json()
    assert details["progress_percentage"] == 50.0
    assert len(details["milestones"]) == 2
    assert len(details["tasks"]) == 1

    # 7. Unlink task
    unlink_res = client.post(f"/api/v1/goals/tasks/{task_id}/unlink")
    assert unlink_res.status_code == 200
    assert unlink_res.json()["goal_id"] is None

    # 8. Test 404 validation errors
    assert client.get("/api/v1/goals/99999").status_code == 404
    assert client.post("/api/v1/goals/99999/tasks/1/link").status_code == 404
