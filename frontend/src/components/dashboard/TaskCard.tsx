import React from 'react';
import type { Task } from '../../types/task';
import { CheckCircle2, Circle, Clock, Trash2, Edit3, RotateCcw } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-badge priority-high';
      case 'medium':
        return 'priority-badge priority-medium';
      default:
        return 'priority-badge priority-low';
    }
  };

  const formatDueTime = (timeStr?: string | null) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const mins = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${mins} ${ampm}`;
  };

  return (
    <div className={`task-card ${task.completed ? 'task-completed' : ''}`}>
      {/* Checkbox Trigger */}
      <button
        type="button"
        className="task-checkbox-btn"
        onClick={() => onToggleComplete(task)}
        aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as completed'}
      >
        {task.completed ? (
          <CheckCircle2 className="task-checkbox-icon icon-completed" size={20} />
        ) : (
          <Circle className="task-checkbox-icon icon-pending" size={20} />
        )}
      </button>

      {/* Main Task Body */}
      <div className="task-details">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          <span className={getPriorityBadgeClass(task.priority)}>
            {task.priority.toUpperCase()}
          </span>
        </div>

        {task.description && <p className="task-description">{task.description}</p>}

        <div className="task-meta-row">
          <span className="task-meta-item">
            ⏱️ {task.estimated_duration_minutes || 30} min
          </span>
          {task.due_time && (
            <span className="task-meta-item">
              <Clock size={13} /> {formatDueTime(task.due_time)}
            </span>
          )}
          {task.due_date && (
            <span className="task-meta-item">
              📅 {task.due_date}
            </span>
          )}
          {Boolean(task.rescheduled_count && task.rescheduled_count > 0) && (
            <span className="task-meta-item task-rescheduled-badge">
              🔄 Rescheduled {task.rescheduled_count}x
            </span>
          )}
          {Boolean(task.goal_id) && (
            <span className="task-meta-item task-goal-badge">
              🎯 Linked Goal
            </span>
          )}
        </div>
      </div>

      {/* Task Quick Actions */}
      <div className="task-actions">
        {task.completed ? (
          <button
            type="button"
            className="task-action-btn"
            title="Reopen task"
            onClick={() => onToggleComplete(task)}
          >
            <RotateCcw size={15} />
          </button>
        ) : (
          onEdit && (
            <button
              type="button"
              className="task-action-btn"
              title="Edit task"
              onClick={() => onEdit(task)}
            >
              <Edit3 size={15} />
            </button>
          )
        )}
        <button
          type="button"
          className="task-action-btn task-action-delete"
          title="Delete task"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
