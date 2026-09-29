# LifeOS — Testing Strategy

## V0.1 Backend

Test:
- task creation
- validation
- task retrieval
- task update
- completion
- reopening
- deletion
- filtering
- invalid task IDs
- invalid priority values

## Frontend

Test:
- task rendering
- add task flow
- edit task flow
- completion interaction
- delete interaction
- loading state
- error state
- empty state
- responsive layout

## Integration

Verify:
Frontend → API → Database → API → Frontend

## Manual QA

Before declaring V0.1 complete:
- create several tasks
- use all priorities
- complete/reopen tasks
- test future dates
- test empty states
- test mobile layout
- refresh browser and verify persistence
