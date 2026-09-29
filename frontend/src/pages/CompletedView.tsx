import React from 'react';
import type { Task } from '../types/task';
import { TaskList } from '../components/dashboard/TaskList';
import { CheckCircle } from 'lucide-react';

interface CompletedViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: number) => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({
  tasks,
  onToggleComplete,
  onDelete,
}) => {
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="view-container">
      <div className="view-header-card">
        <div className="view-header-main">
          <div>
            <div className="view-date-chip">
              <CheckCircle size={14} /> Completed History
            </div>
            <h2 className="view-page-title">Completed Tasks</h2>
          </div>
          <span className="badge badge-success">{completedTasks.length} Done</span>
        </div>
      </div>

      <div className="view-content-section">
        <TaskList
          tasks={completedTasks}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          emptyMessage="No completed tasks yet. Keep going!"
        />
      </div>
    </div>
  );
};
