# LifeOS — API Specification V0.1

Base prefix:

/api/v1

## Tasks

### POST /tasks
Create a task.

### GET /tasks
List tasks with optional filters.

Possible filters:
- status
- date
- priority

### GET /tasks/{task_id}
Get one task.

### PATCH /tasks/{task_id}
Update a task.

### DELETE /tasks/{task_id}
Delete a task.

### PATCH /tasks/{task_id}/complete
Mark task completed.

### PATCH /tasks/{task_id}/reopen
Mark task pending again.

## Response Principles

- consistent response shapes
- appropriate HTTP status codes
- validation errors should be understandable
- never expose database internals unnecessarily

Authentication can be introduced in a later version unless the implementation requires a minimal local user boundary.
