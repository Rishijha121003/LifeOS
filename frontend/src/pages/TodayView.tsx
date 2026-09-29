import React, { useState } from 'react';
import type { Task, TaskExecutionStatus } from '../types/task';
import {
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Sparkles,
  Play,
  SkipForward,
} from 'lucide-react';

interface TodayViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onOpenAddTask: () => void;
  onOpenReschedule?: () => void;
  onUpdateTaskStatus?: (task: Task, status: TaskExecutionStatus) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenAddTask,
  onOpenReschedule,
  onUpdateTaskStatus,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.due_date === todayStr || (!t.due_date && !t.completed));

  const filteredTasks = todayTasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.due_time && b.due_time) {
      return a.due_time.localeCompare(b.due_time);
    }
    if (a.due_time && !b.due_time) return -1;
    if (!a.due_time && b.due_time) return 1;
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const progressPercent = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header Card */}
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            Today's Plan & Execution
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            {completedCount} of {todayTasks.length} tasks completed ({progressPercent}%) • Manage timeline, focus blocks, and priority.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {onOpenReschedule && (
            <button
              type="button"
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={onOpenReschedule}
            >
              <Sparkles size={16} color="#4F46E5" />
              <span>Smart Reschedule</span>
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={onOpenAddTask}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`date-nav-pill ${filter === tab ? 'active' : ''}`}
              style={{
                backgroundColor: filter === tab ? '#4F46E5' : '#ffffff',
                color: filter === tab ? '#ffffff' : '#475569',
                borderColor: filter === tab ? '#4F46E5' : '#E2E8F0',
                padding: '6px 14px',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'all' ? todayTasks.length : tab === 'pending' ? todayTasks.length - completedCount : completedCount})
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedTasks.length === 0 ? (
          <div className="bento-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>No tasks found in this view.</p>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '4px' }}>
              Create a new task or enjoy your free time!
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className="bento-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                opacity: task.completed ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => onToggleComplete(task)}
                  style={{ color: task.completed ? '#10B981' : '#CBD5E1', display: 'flex', alignItems: 'center' }}
                  title={task.completed ? 'Reopen task' : 'Mark completed'}
                >
                  {task.completed ? <CheckCircle2 size={22} fill="#10B981" color="#ffffff" /> : <Circle size={22} />}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: task.completed ? '#94A3B8' : '#0F172A',
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </span>
                    {task.status && task.status !== 'NOT_STARTED' && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background:
                            task.status === 'COMPLETED'
                              ? '#ECFDF5'
                              : task.status === 'IN_PROGRESS'
                              ? '#EEF2FF'
                              : task.status === 'SKIPPED'
                              ? '#F1F5F9'
                              : '#FEF2F2',
                          color:
                            task.status === 'COMPLETED'
                              ? '#047857'
                              : task.status === 'IN_PROGRESS'
                              ? '#4F46E5'
                              : task.status === 'SKIPPED'
                              ? '#64748B'
                              : '#DC2626',
                        }}
                      >
                        {task.status}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <span style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '2px' }}>
                      {task.description}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    {task.due_time && (
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {task.due_time.substring(0, 5)}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      ⏳ Planned: {task.estimated_duration_minutes || 30}m
                      {task.actual_duration_minutes ? ` • Actual: ${task.actual_duration_minutes}m` : ''}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          task.priority === 'high'
                            ? '#FEF2F2'
                            : task.priority === 'medium'
                            ? '#FFFBEB'
                            : '#F1F5F9',
                        color:
                          task.priority === 'high'
                            ? '#EF4444'
                            : task.priority === 'medium'
                            ? '#D97706'
                            : '#64748B',
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!task.completed && onUpdateTaskStatus && (
                  <>
                    <button
                      type="button"
                      className="date-nav-btn"
                      onClick={() => onUpdateTaskStatus(task, task.status === 'IN_PROGRESS' ? 'NOT_STARTED' : 'IN_PROGRESS')}
                      title={task.status === 'IN_PROGRESS' ? 'Pause Task' : 'Start Task'}
                      style={{ color: '#4F46E5' }}
                    >
                      <Play size={13} />
                    </button>
                    <button
                      type="button"
                      className="date-nav-btn"
                      onClick={() => onUpdateTaskStatus(task, 'SKIPPED')}
                      title="Skip Task"
                    >
                      <SkipForward size={13} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="date-nav-btn"
                  onClick={() => onEdit(task)}
                  title="Edit task"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  className="date-nav-btn"
                  onClick={() => onDelete(task.id)}
                  title="Delete task"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
