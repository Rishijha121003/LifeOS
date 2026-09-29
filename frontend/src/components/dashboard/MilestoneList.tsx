import React, { useState } from 'react';
import type { GoalMilestone } from '../../types/goal';
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react';

interface MilestoneListProps {
  goalId: number;
  milestones: GoalMilestone[];
  onToggleMilestone: (milestone: GoalMilestone) => void;
  onAddMilestone: (goalId: number, title: string) => Promise<void>;
  onDeleteMilestone: (milestoneId: number) => void;
}

export const MilestoneList: React.FC<MilestoneListProps> = ({
  goalId,
  milestones,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAdding(true);
    try {
      await onAddMilestone(goalId, newTitle.trim());
      setNewTitle('');
    } catch {
      // Handled in parent
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="milestones-section">
      <div className="milestones-header">
        <h4 className="milestones-title">Milestones ({milestones.filter((m) => m.completed).length} / {milestones.length})</h4>
      </div>

      <div className="milestones-list">
        {milestones.map((m) => (
          <div key={m.id} className={`milestone-item ${m.completed ? 'milestone-completed' : ''}`}>
            <button
              type="button"
              className="milestone-toggle-btn"
              onClick={() => onToggleMilestone(m)}
              aria-label={m.completed ? 'Mark milestone incomplete' : 'Mark milestone complete'}
            >
              {m.completed ? (
                <CheckSquare size={16} className="text-success" />
              ) : (
                <Square size={16} className="text-muted" />
              )}
            </button>
            <span className="milestone-label">{m.title}</span>
            <button
              type="button"
              className="task-action-btn task-action-delete"
              onClick={() => onDeleteMilestone(m.id)}
              title="Delete milestone"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Inline Quick Milestone Add Form */}
      <form onSubmit={handleAddSubmit} className="milestone-add-form">
        <input
          type="text"
          className="milestone-add-input"
          placeholder="+ Add new milestone..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={isAdding}
        />
        {newTitle.trim() && (
          <button type="submit" className="btn btn-secondary btn-sm" disabled={isAdding}>
            <Plus size={13} /> Add
          </button>
        )}
      </form>
    </div>
  );
};
