import React, { useState, useEffect } from 'react';
import type { Task, TaskCreatePayload, PriorityLevel } from '../../types/task';
import type { Goal, GoalMilestone } from '../../types/goal';
import { fetchGoals, fetchGoalDetail } from '../../api/goals';
import { X } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskCreatePayload, editingTaskId?: number) => void;
  taskToEdit?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('18:00');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [goalId, setGoalId] = useState<number | null>(null);
  const [milestoneId, setMilestoneId] = useState<number | null>(null);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [availableMilestones, setAvailableMilestones] = useState<GoalMilestone[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGoals('all')
        .then((goals) => setAvailableGoals(goals.filter((g) => g.status === 'active')))
        .catch(() => setAvailableGoals([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail(goalId)
        .then((detail) => setAvailableMilestones(detail.milestones || []))
        .catch(() => setAvailableMilestones([]));
    } else {
      setAvailableMilestones([]);
      setMilestoneId(null);
    }
  }, [goalId]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.due_date || new Date().toISOString().split('T')[0]);
      setDueTime(taskToEdit.due_time || '18:00');
      setEstimatedDuration(taskToEdit.estimated_duration_minutes || 30);
      setGoalId(taskToEdit.goal_id || null);
      setMilestoneId(taskToEdit.milestone_id || null);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('18:00');
      setEstimatedDuration(30);
      setGoalId(null);
      setMilestoneId(null);
    }
    setError('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    onSubmit(
      {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        estimated_duration_minutes: Number(estimatedDuration) || 30,
        goal_id: goalId,
        milestone_id: milestoneId,
      },
      taskToEdit?.id
    );

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Task Title *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Build CRUD endpoints with SQLAlchemy"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Description / Notes
              </label>
              <textarea
                className="form-textarea"
                placeholder="Add relevant notes, LeetCode link, or checklist..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Duration</label>
                <select
                  className="form-select"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value, 10))}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min (1 hr)</option>
                  <option value={90}>90 min (1.5 hr)</option>
                  <option value={120}>120 min (2 hr)</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>

            {/* Goal and Milestone selector */}
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Align with Goal (Optional)</label>
                <select
                  className="form-select"
                  value={goalId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGoalId(val ? parseInt(val, 10) : null);
                  }}
                >
                  <option value="">No Linked Goal</option>
                  {availableGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      🎯 {g.title} ({g.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Milestone (Optional)</label>
                <select
                  className="form-select"
                  disabled={!goalId || availableMilestones.length === 0}
                  value={milestoneId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMilestoneId(val ? parseInt(val, 10) : null);
                  }}
                >
                  <option value="">
                    {!goalId
                      ? 'Select Goal First'
                      : availableMilestones.length === 0
                      ? 'No milestones in goal'
                      : 'General / No Milestone'}
                  </option>
                  {availableMilestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      🏁 {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
