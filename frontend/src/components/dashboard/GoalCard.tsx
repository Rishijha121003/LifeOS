import React, { useState } from 'react';
import type { GoalDetail, GoalMilestone, GoalStatus } from '../../types/goal';
import { MilestoneList } from './MilestoneList';
import { Target, Calendar, CheckCircle, Edit3, Trash2, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';

interface GoalCardProps {
  goal: GoalDetail;
  onEdit: (goal: GoalDetail) => void;
  onUpdateStatus: (goalId: number, status: GoalStatus) => void;
  onDelete: (goalId: number) => void;
  onToggleMilestone: (milestone: GoalMilestone) => void;
  onAddMilestone: (goalId: number, title: string) => Promise<void>;
  onDeleteMilestone: (milestoneId: number) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onUpdateStatus,
  onDelete,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
}) => {
  const [showMilestones, setShowMilestones] = useState(true);

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'archived':
        return <span className="badge badge-secondary">Archived</span>;
      default:
        return <span className="badge badge-indigo">Active</span>;
    }
  };

  const roundedProgress = Math.round(goal.progress_percentage || 0);

  return (
    <div className={`goal-card ${goal.status === 'completed' ? 'goal-completed' : ''}`}>
      {/* Goal Header Row */}
      <div className="goal-header">
        <div className="goal-title-area">
          <span className="goal-category-tag">{goal.category || 'General'}</span>
          <h3 className="goal-title">{goal.title}</h3>
        </div>

        <div className="goal-actions">
          {getStatusBadge(goal.status)}
          <button
            type="button"
            className="task-action-btn"
            title="Edit goal"
            onClick={() => onEdit(goal)}
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            className="task-action-btn task-action-delete"
            title="Delete goal"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {goal.description && <p className="goal-description">{goal.description}</p>}

      {/* Target Date & Meta Row */}
      <div className="goal-meta-row">
        {goal.target_date && (
          <span className="goal-meta-item">
            <Calendar size={14} /> Target: {goal.target_date}
          </span>
        )}
        {goal.tasks && goal.tasks.length > 0 && (
          <span className="goal-meta-item">
            <LinkIcon size={13} /> {goal.tasks.length} Linked Tasks
          </span>
        )}
      </div>

      {/* Backend-Calculated Goal Progress Bar */}
      <div className="goal-progress-container">
        <div className="goal-progress-info">
          <span className="goal-progress-label">Overall Progress</span>
          <span className="goal-progress-percent">{roundedProgress}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${roundedProgress === 100 ? 'fill-completed' : ''}`}
            style={{ width: `${roundedProgress}%` }}
          />
        </div>
      </div>

      {/* Milestone Toggle & List */}
      <div className="goal-milestone-toggle-bar">
        <button
          type="button"
          className="milestone-toggle-section-btn"
          onClick={() => setShowMilestones(!showMilestones)}
        >
          <Target size={14} />
          <span>Milestones ({goal.milestones ? goal.milestones.length : 0})</span>
          {showMilestones ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {goal.status !== 'completed' && roundedProgress === 100 && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onUpdateStatus(goal.id, 'completed')}
          >
            <CheckCircle size={14} /> Mark Goal Complete
          </button>
        )}
      </div>

      {showMilestones && (
        <MilestoneList
          goalId={goal.id}
          milestones={goal.milestones || []}
          onToggleMilestone={onToggleMilestone}
          onAddMilestone={onAddMilestone}
          onDeleteMilestone={onDeleteMilestone}
        />
      )}
    </div>
  );
};
