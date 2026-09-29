import React, { useState, useEffect } from 'react';
import type { Habit, HabitCreatePayload, HabitFrequency, HabitPriority } from '../../types/habit';
import { X } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: HabitCreatePayload, editingHabitId?: number) => Promise<void>;
  habitToEdit?: Habit | null;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  habitToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<HabitFrequency>('daily');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number>(7);
  const [priority, setPriority] = useState<HabitPriority>('medium');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setTitle(habitToEdit.title);
      setDescription(habitToEdit.description || '');
      setFrequencyType(habitToEdit.frequency_type);
      setTargetDaysPerWeek(habitToEdit.target_days_per_week);
      setPriority(habitToEdit.priority);
    } else {
      setTitle('');
      setDescription('');
      setFrequencyType('daily');
      setTargetDaysPerWeek(7);
      setPriority('medium');
    }
    setError(null);
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim() || null,
          frequency_type: frequencyType,
          target_days_per_week: targetDaysPerWeek,
          priority: priority,
        },
        habitToEdit ? habitToEdit.id : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save habit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{habitToEdit ? 'Edit Habit Routine' : 'Create New Habit'}</h3>
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
              <label className="form-label" htmlFor="habit-title">
                Habit Title *
              </label>
              <input
                id="habit-title"
                type="text"
                className="form-input"
                placeholder="e.g. Daily LeetCode Problem"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-desc">
                Description / Intention
              </label>
              <textarea
                id="habit-desc"
                className="form-textarea"
                placeholder="e.g. Build algorithm problem solving consistency"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={submitting}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="habit-freq">
                  Frequency
                </label>
                <select
                  id="habit-freq"
                  className="form-select"
                  value={frequencyType}
                  onChange={(e) => {
                    const val = e.target.value as HabitFrequency;
                    setFrequencyType(val);
                    if (val === 'daily') setTargetDaysPerWeek(7);
                  }}
                  disabled={submitting}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly Target</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="habit-target">
                  Target Days / Wk
                </label>
                <input
                  id="habit-target"
                  type="number"
                  min={1}
                  max={7}
                  className="form-input"
                  value={targetDaysPerWeek}
                  onChange={(e) => setTargetDaysPerWeek(parseInt(e.target.value, 10) || 1)}
                  disabled={submitting || frequencyType === 'daily'}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-priority">
                Priority
              </label>
              <select
                id="habit-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as HabitPriority)}
                disabled={submitting}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : habitToEdit ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
