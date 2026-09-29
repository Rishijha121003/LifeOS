# LifeOS — Database Design V0.1

## Task

Fields:

- id: primary key
- title: required string
- description: optional text
- due_date: optional date
- due_time: optional time
- priority: low / medium / high
- completed: boolean
- created_at: timestamp
- updated_at: timestamp

## Design Principles

- use proper database types
- add useful indexes only where justified
- use migrations
- do not store derived values unnecessarily
- keep timestamps consistent

## Future Entities

Do not implement yet, but future versions may introduce:
- User
- Expense
- Habit
- StudySession
- Schedule
- Notification
- AIInteraction

Future schema changes must be handled through migrations.
