- full-width task list
- floating or prominent Add Task action
- touch-friendly controls

## 5. Dashboard

Suggested hierarchy:

Greeting
    ↓
Date / short contextual text
    ↓
Today's summary
    ↓
Progress indicator
    ↓
Today's tasks
    ↓
Completed section

The dashboard should prioritize tasks over statistics.

Statistics are supporting information, not the main content.

## 6. Task Card

A task card should expose only useful information:

- checkbox
- title
- due time/date
- priority
- optional description

Interactions:
- click checkbox → complete
- click task → view/edit
- secondary menu → edit/delete

Completed tasks should become visually quieter but remain readable.

## 7. Add Task

Adding a task should require minimal effort.

Required:
- title

Optional:
- description
- due date
- due time
- priority

Do not make users fill unnecessary fields.

## 8. Priority

Use subtle visual differentiation.

High:
- noticeable but not aggressive

Medium:
- normal emphasis

Low:
- quiet

Do not use color alone to communicate priority; include text/icon semantics where appropriate.

## 9. Empty States

Example:

### No tasks today
"You're all clear for today."

Secondary action:
"+ Add task"

### No upcoming tasks
"No upcoming tasks yet."

The page should still feel intentional.

## 10. Loading States

Prefer skeletons or contextual loading indicators.

Avoid full-page spinners for small operations.

## 11. Feedback

Use toast/snackbar feedback for:
- task created
- task updated
- task deleted
- task completed

Avoid browser alert() for normal product interactions.

## 12. Motion

Animations should communicate state changes, not decorate the interface.

Examples:
- checkbox completion transition
- task card subtle transition
- modal entrance
- toast appearance

Keep motion fast and restrained.

## 13. Accessibility

Must support:
- keyboard navigation
- visible focus states
- readable contrast
- semantic buttons
- labels for form controls
- meaningful empty/error messages
- touch-friendly controls

Do not rely solely on color.

## 14. Responsive Breakpoints

Design intentionally for:
- mobile
- tablet
- laptop
- large desktop

Check real layouts rather than relying only on CSS shrinking.

## 15. Design System

Before implementing many screens, define:
- typography scale
- spacing scale
- radius scale
- button variants
- input styles
- card style
- badge/priority style
- modal style
- toast style

Reuse these consistently.

## 16. UI Review Gate

Before final UI implementation, discuss and approve:
- overall visual direction
- color/accent
- typography
- sidebar/navigation
- dashboard composition
- task card design
- add-task interaction
- mobile navigation

Do NOT make large UI assumptions before this review.

## 17. V0.1 UI Priority

Priority order:

1. Usability
2. Information hierarchy
3. Consistency
4. Responsiveness
5. Accessibility
6. Visual polish
7. Animation

Beautiful UI must never make basic task management slower.
