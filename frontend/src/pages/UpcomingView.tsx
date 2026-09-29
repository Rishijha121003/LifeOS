import React from 'react';
import type { Task } from '../types/task';
import { TaskList } from '../components/dashboard/TaskList';
import { CalendarDays, Plus } from 'lucide-react';

interface UpcomingViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onOpenAddTask: () => void;
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenAddTask,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const upcomingTasks = tasks.filter((t) => !t.completed && (t.due_date ? t.due_date > todayStr : false));
  const tomorrowTasks = upcomingTasks.filter((t) => t.due_date === tomorrowStr);
  const laterTasks = upcomingTasks.filter((t) => t.due_date !== tomorrowStr);

  return (
    <div className="view-container">
      <div className="view-header-card">
        <div className="view-header-main">
          <div>
            <div className="view-date-chip">
              <CalendarDays size={14} /> Schedule Overview
            </div>
            <h2 className="view-page-title">Upcoming Tasks</h2>
          </div>
          <button type="button" className="btn btn-primary" onClick={onOpenAddTask}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      <div className="view-content-section space-y-6">
        <TaskList
          title="Tomorrow"
          tasks={tomorrowTasks}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          emptyMessage="No tasks scheduled for tomorrow."
        />

        <TaskList
          title="Later"
          tasks={laterTasks}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          emptyMessage="No future tasks scheduled beyond tomorrow."
        />
      </div>
    </div>
  );
};
