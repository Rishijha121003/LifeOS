from datetime import date
from fastapi.testclient import TestClient

# 1 & 2. GET /suggest Success & Available Time Calculation
def test_get_suggest_success(client: TestClient):
    response = client.get("/api/v1/planning/suggest?current_time=21:00&current_date=2026-08-21")
    assert response.status_code == 200
    data = response.json()
    assert data["current_time"] == "21:00"
    assert data["day_end_time"] == "23:00"
    assert data["available_minutes"] == 120
    assert "summary" in data


# 3 & 14. GET /suggest Read-Only Behavior
def test_get_suggest_is_read_only(client: TestClient):
    create_res = client.post("/api/v1/tasks/", json={"title": "Task 1", "estimated_duration_minutes": 40, "due_date": "2026-08-21"})
    t_id = create_res.json()["id"]

    res1 = client.get("/api/v1/planning/suggest?current_time=21:00&current_date=2026-08-21")
    res2 = client.get("/api/v1/planning/suggest?current_time=21:00&current_date=2026-08-21")
    
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json() == res2.json()

    # Verify task in DB remains unmodified
    get_res = client.get(f"/api/v1/tasks/{t_id}")
    assert get_res.json()["due_date"] == "2026-08-21"
    assert get_res.json()["rescheduled_count"] == 0


# 4 & 5. GET /suggest returns do_now and move_to_tomorrow
def test_get_suggest_categorization(client: TestClient):
    client.post("/api/v1/tasks/", json={"title": "Small Task", "priority": "high", "estimated_duration_minutes": 30, "due_date": "2026-08-21"})
    client.post("/api/v1/tasks/", json={"title": "Large Task", "priority": "low", "estimated_duration_minutes": 90, "due_date": "2026-08-21"})

    res = client.get("/api/v1/planning/suggest?current_time=21:00&current_date=2026-08-21&target_end_time=22:00")
    assert res.status_code == 200
    data = res.json()

    assert data["available_minutes"] == 60
    assert len(data["do_now"]) == 1
    assert data["do_now"][0]["title"] == "Small Task"
    assert "fits within remaining" in data["do_now"][0]["reason"]

    assert len(data["move_to_tomorrow"]) == 1
    assert data["move_to_tomorrow"][0]["title"] == "Large Task"
    assert "Exceeds remaining available capacity" in data["move_to_tomorrow"][0]["reason"]


# 6, 7, 8, 9. POST /apply Success, Previous Date, Rescheduled Count, Field Preservation
def test_post_apply_success_and_field_preservation(client: TestClient):
    create_res = client.post("/api/v1/tasks/", json={
        "title": "Original Title",
        "description": "Important detail",
        "priority": "high",
        "due_date": "2026-08-21",
        "estimated_duration_minutes": 45
    })
    t_id = create_res.json()["id"]

    payload = {
        "reschedule_task_ids": [t_id],
        "target_date": "2026-08-22"
    }
    response = client.post("/api/v1/planning/apply", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "success", "updated_count": 1}

    # Verify updated task
    get_res = client.get(f"/api/v1/tasks/{t_id}")
    task_data = get_res.json()
    assert task_data["due_date"] == "2026-08-22"
    assert task_data["rescheduled_from_date"] == "2026-08-21"
    assert task_data["rescheduled_count"] == 1
    # Preserved fields
    assert task_data["title"] == "Original Title"
    assert task_data["description"] == "Important detail"
    assert task_data["priority"] == "high"
    assert task_data["estimated_duration_minutes"] == 45


# 10. POST /apply with Nonexistent ID
def test_post_apply_nonexistent_id(client: TestClient):
    payload = {
        "reschedule_task_ids": [999999],
        "target_date": "2026-08-22"
    }
    response = client.post("/api/v1/planning/apply", json=payload)
    assert response.status_code == 404
    assert "do not exist" in response.json()["detail"]


# 11. POST /apply with Empty IDs
def test_post_apply_empty_ids(client: TestClient):
    payload = {
        "reschedule_task_ids": [],
        "target_date": "2026-08-22"
    }
    response = client.post("/api/v1/planning/apply", json=payload)
    assert response.status_code == 422  # Pydantic validation error


# 12. POST /apply with Duplicate IDs
def test_post_apply_duplicate_ids(client: TestClient):
    create_res = client.post("/api/v1/tasks/", json={"title": "Task 1", "due_date": "2026-08-21"})
    t_id = create_res.json()["id"]

    payload = {
        "reschedule_task_ids": [t_id, t_id],
        "target_date": "2026-08-22"
    }
    response = client.post("/api/v1/planning/apply", json=payload)
    assert response.status_code == 200
    assert response.json()["updated_count"] == 1


# 13. POST /apply Atomic Rollback Behavior
def test_post_apply_atomic_rollback(client: TestClient):
    create_res = client.post("/api/v1/tasks/", json={"title": "Valid Task", "due_date": "2026-08-21"})
    t_id = create_res.json()["id"]

    # Request batch with 1 valid ID and 1 invalid ID
    payload = {
        "reschedule_task_ids": [t_id, 888888],
        "target_date": "2026-08-22"
    }
    response = client.post("/api/v1/planning/apply", json=payload)
    assert response.status_code == 404

    # Verify ZERO tasks were modified in DB
    get_res = client.get(f"/api/v1/tasks/{t_id}")
    task_data = get_res.json()
    assert task_data["due_date"] == "2026-08-21"
    assert task_data["rescheduled_count"] == 0
    assert task_data["rescheduled_from_date"] is None
