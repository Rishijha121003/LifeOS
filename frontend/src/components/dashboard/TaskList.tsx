import React from 'react';
import type { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import { CheckCircle2 } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  onToggleComplete: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: number) => void;
  emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  title,
  onToggleComplete,
  onEdit,
  onDelete,
  emptyMessage = 'No tasks found. Click "+ Add Task" to create one!',
}) => {
  return (
    <div className="task-list-section">
      {title && <h3 className="task-list-title">{title}</h3>}

      {tasks.length === 0 ? (
        <div className="empty-task-state">
          <CheckCircle2 size={32} className="empty-icon" />
          <p className="empty-message">{emptyMessage}</p>
        </div>
      ) : (
        <div className="task-cards-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
