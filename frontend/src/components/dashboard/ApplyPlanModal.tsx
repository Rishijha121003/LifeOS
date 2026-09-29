import React, { useEffect } from 'react';
import type { TaskRecommendation } from '../../types/planning';
import { X, CalendarDays, Check, ArrowRight } from 'lucide-react';

interface ApplyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tasksToMove: TaskRecommendation[];
  targetDate: string;
  isApplying: boolean;
}

export const ApplyPlanModal: React.FC<ApplyPlanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tasksToMove,
  targetDate,
  isApplying,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content apply-plan-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <CalendarDays size={20} className="modal-header-icon" />
            <h2 id="apply-modal-title" className="modal-title">
              Move tasks to tomorrow?
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isApplying}
          >
            <X size={18} />
          </button>
        </div>

        <div className="apply-modal-body">
          <p className="apply-modal-subtitle">
            LifeOS recommends rescheduling {tasksToMove.length} task{tasksToMove.length === 1 ? '' : 's'} to tomorrow ({targetDate}) to maintain a balanced workload.
          </p>

          <div className="apply-modal-task-list">
            {tasksToMove.map((task) => (
              <div key={task.id} className="apply-modal-task-card">
                <div className="apply-modal-task-header">
                  <span className="apply-modal-task-title">{task.title}</span>
                  <span className={getPriorityBadgeClass(task.priority)}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                <div className="apply-modal-task-meta">
                  <span>⏱️ {task.estimated_duration_minutes} min</span>
                  <span className="apply-modal-meta-arrow">
                    <ArrowRight size={13} /> Target: {targetDate}
                  </span>
                </div>
                <p className="apply-modal-task-reason">{task.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <div className="loading-spinner-sm" /> Applying Plan...
              </>
            ) : (
              <>
                <Check size={16} /> Confirm & Apply Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
