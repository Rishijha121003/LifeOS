import React, { useState, useEffect } from 'react';
import type { GoalDetail, GoalCreatePayload, GoalStatus } from '../../types/goal';
import { X, Plus, Trash2 } from 'lucide-react';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: GoalCreatePayload, editingGoalId?: number) => Promise<void>;
  goalToEdit?: GoalDetail | null;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  goalToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Career');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [initialMilestones, setInitialMilestones] = useState<string[]>([]);
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description || '');
      setCategory(goalToEdit.category || 'Career');
      setTargetDate(goalToEdit.target_date || '');
      setStatus(goalToEdit.status);
      setInitialMilestones([]);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Career');
      setTargetDate('');
      setStatus('active');
      setInitialMilestones([]);
    }
    setNewMilestoneInput('');
    setError(null);
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddInitialMilestone = () => {
    if (!newMilestoneInput.trim()) return;
    setInitialMilestones([...initialMilestones, newMilestoneInput.trim()]);
    setNewMilestoneInput('');
  };

  const handleRemoveInitialMilestone = (idx: number) => {
    setInitialMilestones(initialMilestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Goal title is required.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || 'General',
          target_date: targetDate || null,
          status,
          milestones: initialMilestones.map((m, idx) => ({ title: m, order_index: idx + 1 })),
        },
        goalToEdit ? goalToEdit.id : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save goal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{goalToEdit ? 'Edit Goal' : 'Define New Goal'}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error-alert">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="goal-title">
              Goal Title <span className="text-danger">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              className="form-input"
              placeholder="e.g. Master Backend Engineering Architecture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="goal-desc">
              Description / Vision
            </label>
            <textarea
              id="goal-desc"
              className="form-textarea"
              placeholder="e.g. Complete core system design mastery and build production scalable tools"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              disabled={submitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group col-half">
              <label className="form-label" htmlFor="goal-category">
                Category
              </label>
              <select
                id="goal-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                <option value="Career">Career & Tech</option>
                <option value="Learning">Learning & Education</option>
                <option value="Health">Health & Fitness</option>
                <option value="Personal">Personal & Financial</option>
              </select>
            </div>

            <div className="form-group col-half">
              <label className="form-label" htmlFor="goal-target">
                Target Completion Date
              </label>
              <input
                id="goal-target"
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {goalToEdit && (
            <div className="form-group">
              <label className="form-label" htmlFor="goal-status">
                Status
              </label>
              <select
                id="goal-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                disabled={submitting}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {!goalToEdit && (
            <div className="form-group">
              <label className="form-label">Initial Milestones (Optional)</label>
              <div className="milestone-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a key milestone..."
                  value={newMilestoneInput}
                  onChange={(e) => setNewMilestoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInitialMilestone();
                    }
                  }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddInitialMilestone}
                  disabled={submitting || !newMilestoneInput.trim()}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              {initialMilestones.length > 0 && (
                <div className="initial-milestones-preview">
                  {initialMilestones.map((m, idx) => (
                    <div key={idx} className="initial-milestone-tag">
                      <span>{idx + 1}. {m}</span>
                      <button
                        type="button"
                        className="btn-icon-xs"
                        onClick={() => handleRemoveInitialMilestone(idx)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : goalToEdit ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
