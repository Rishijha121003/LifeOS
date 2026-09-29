import React from 'react';
import type { Habit } from '../../types/habit';
import { Flame, Trophy, CheckCircle2, Check, Edit3, Archive, ArchiveRestore, Trash2 } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  isLoggedToday: boolean;
  onLogToday: (habitId: number) => void;
  onEdit: (habit: Habit) => void;
  onToggleArchive: (habit: Habit) => void;
  onDelete: (habitId: number) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isLoggedToday,
  onLogToday,
  onEdit,
  onToggleArchive,
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

  return (
    <div className={`habit-card ${habit.archived ? 'habit-archived' : ''}`}>
      {/* 1. Header Row */}
      <div className="habit-header">
        <div className="habit-title-area">
          <h3 className="habit-title">{habit.title}</h3>
          
          <div className="habit-badges-row">
            <span className={getPriorityBadgeClass(habit.priority)}>
              {habit.priority.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: '#EEF2FF',
                color: '#4F46E5',
              }}
            >
              {habit.frequency_type === 'daily' ? 'Daily' : `${habit.target_days_per_week}x / wk`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="habit-actions">
          <button
            type="button"
            className="task-action-btn"
            title="Edit habit"
            onClick={() => onEdit(habit)}
            style={{ padding: '5px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            className="task-action-btn"
            title={habit.archived ? 'Unarchive habit' : 'Archive habit'}
            onClick={() => onToggleArchive(habit)}
            style={{ padding: '5px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            {habit.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </button>
          <button
            type="button"
            className="task-action-btn task-action-delete"
            title="Delete habit"
            onClick={() => onDelete(habit.id)}
            style={{ padding: '5px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* 2. Habit Description */}
      {habit.description ? (
        <p className="habit-description">{habit.description}</p>
      ) : (
        <div style={{ height: '8px' }} />
      )}

      {/* 3. Streak Metrics 3-Column Box */}
      <div className="habit-metrics-grid">
        <div className="habit-metric-box">
          <div className="habit-metric-value-row">
            <Flame size={15} color="#EA580C" />
            <span className="habit-metric-value" style={{ color: '#EA580C' }}>
              {habit.current_streak || 0}d
            </span>
          </div>
          <span className="habit-metric-label">Current</span>
        </div>

        <div className="habit-metric-box" style={{ borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
          <div className="habit-metric-value-row">
            <Trophy size={15} color="#D97706" />
            <span className="habit-metric-value" style={{ color: '#D97706' }}>
              {habit.best_streak || 0}d
            </span>
          </div>
          <span className="habit-metric-label">Best</span>
        </div>

        <div className="habit-metric-box">
          <div className="habit-metric-value-row">
            <Check size={15} color="#4F46E5" />
            <span className="habit-metric-value" style={{ color: '#4F46E5' }}>
              {habit.total_completions || 0}
            </span>
          </div>
          <span className="habit-metric-label">Total Logs</span>
        </div>
      </div>

      {/* 4. Footer Action */}
      {!habit.archived && (
        <div className="habit-footer">
          <button
            type="button"
            className={`habit-log-btn ${isLoggedToday ? 'habit-logged' : 'btn-primary'}`}
            onClick={() => !isLoggedToday && onLogToday(habit.id)}
            disabled={isLoggedToday}
          >
            {isLoggedToday ? (
              <>
                <CheckCircle2 size={16} color="#059669" />
                <span>Completed Today</span>
              </>
            ) : (
              <>
                <Flame size={16} />
                <span>Mark Done Today</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
