from datetime import date, timedelta
from fastapi.testclient import TestClient

# 1. Create task
def test_create_task_success(client: TestClient):
    payload = {
        "title": "Design LifeOS API",
        "description": "Build FastAPI CRUD endpoints",
        "due_date": str(date.today()),
        "due_time": "14:30:00",
        "priority": "high"
    }
    response = client.post("/api/v1/tasks/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == "Design LifeOS API"
    assert data["priority"] == "high"
    assert data["completed"] is False

# 2. Create task with invalid title
def test_create_task_invalid_title(client: TestClient):
    payload = {"title": "   ", "priority": "medium"}
    response = client.post("/api/v1/tasks/", json=payload)
    assert response.status_code == 422  # Unprocessable Entity

# 3. Create task with invalid priority
def test_create_task_invalid_priority(client: TestClient):
    payload = {"title": "Valid Title", "priority": "super_high"}
    response = client.post("/api/v1/tasks/", json=payload)
    assert response.status_code == 422

# 4. Get task
def test_get_task_success(client: TestClient):
    create_res = client.post("/api/v1/tasks/", json={"title": "Read Documentation"})
    task_id = create_res.json()["id"]

    response = client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Read Documentation"

# 5. Get missing task
def test_get_missing_task(client: TestClient):
    response = client.get("/api/v1/tasks/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"

# 6. List tasks
def test_list_tasks(client: TestClient):
    client.post("/api/v1/tasks/", json={"title": "Task One"})
    client.post("/api/v1/tasks/", json={"title": "Task Two"})

    response = client.get("/api/v1/tasks/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

# 7. Filter today's tasks
def test_filter_today_tasks(client: TestClient):
    today_str = str(date.today())
    tomorrow_str = str(date.today() + timedelta(days=1))

    client.post("/api/v1/tasks/", json={"title": "Today Work", "due_date": today_str})
    client.post("/api/v1/tasks/", json={"title": "Future Work", "due_date": tomorrow_str})

    response = client.get("/api/v1/tasks/?view=today")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Today Work"

# 8. Filter upcoming tasks
def test_filter_upcoming_tasks(client: TestClient):
    today_str = str(date.today())
    tomorrow_str = str(date.today() + timedelta(days=1))

    client.post("/api/v1/tasks/", json={"title": "Today Work", "due_date": today_str})
    client.post("/api/v1/tasks/", json={"title": "Tomorrow Task", "due_date": tomorrow_str})

    response = client.get("/api/v1/tasks/?view=upcoming")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Tomorrow Task"

# 9. Filter completed tasks
def test_filter_completed_tasks(client: TestClient):
    res1 = client.post("/api/v1/tasks/", json={"title": "Pending Task"})
    res2 = client.post("/api/v1/tasks/", json={"title": "Done Task"})
    task2_id = res2.json()["id"]

    client.patch(f"/api/v1/tasks/{task2_id}/complete")

    response = client.get("/api/v1/tasks/?view=completed")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Done Task"
    assert data[0]["completed"] is True

# 10. Update task
def test_update_task(client: TestClient):
    res = client.post("/api/v1/tasks/", json={"title": "Initial Title", "priority": "low"})
    task_id = res.json()["id"]

    update_payload = {"title": "Updated Title", "priority": "high"}
    response = client.patch(f"/api/v1/tasks/{task_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["priority"] == "high"

# 11. Complete task
def test_complete_task(client: TestClient):
    res = client.post("/api/v1/tasks/", json={"title": "Task to Complete"})
    task_id = res.json()["id"]

    response = client.patch(f"/api/v1/tasks/{task_id}/complete")
    assert response.status_code == 200
    assert response.json()["completed"] is True

# 12. Reopen task
def test_reopen_task(client: TestClient):
    res = client.post("/api/v1/tasks/", json={"title": "Task to Reopen"})
    task_id = res.json()["id"]

    client.patch(f"/api/v1/tasks/{task_id}/complete")
    response = client.patch(f"/api/v1/tasks/{task_id}/reopen")
    assert response.status_code == 200
    assert response.json()["completed"] is False

# 13. Delete task
def test_delete_task(client: TestClient):
    res = client.post("/api/v1/tasks/", json={"title": "Task to Delete"})
    task_id = res.json()["id"]

    del_res = client.delete(f"/api/v1/tasks/{task_id}")
    assert del_res.status_code == 200

    get_res = client.get(f"/api/v1/tasks/{task_id}")
    assert get_res.status_code == 404
