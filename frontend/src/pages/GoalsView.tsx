import React, { useState, useEffect } from 'react';
import type { GoalDetail, GoalMilestone, MilestoneStatus } from '../types/goal';
import type { Task } from '../types/task';
import { fetchGoals, fetchGoalDetail, createGoal, updateMilestone } from '../api/goals';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
} from 'lucide-react';

interface GoalsViewProps {
  tasks?: Task[];
  showToast: (text: string, type?: 'success' | 'info') => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ tasks = [], showToast }) => {
  const [goals, setGoals] = useState<GoalDetail[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Career');
  const [newTargetDate, setNewTargetDate] = useState('');

  const loadGoals = async () => {
    try {
      const basicGoals = await fetchGoals();
      const fullGoals = await Promise.all(
        basicGoals.map((g) => fetchGoalDetail(g.id).catch(() => ({
          ...g,
          milestones: [] as GoalMilestone[],
          tasks: [],
        })))
      );
      setGoals(fullGoals);
      if (fullGoals.length > 0 && expandedGoalId === null) {
        setExpandedGoalId(fullGoals[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleToggleMilestone = async (milestone: GoalMilestone) => {
    try {
      const nextCompleted = !milestone.completed;
      const nextStatus: MilestoneStatus = nextCompleted ? 'COMPLETED' : 'IN_PROGRESS';
      await updateMilestone(milestone.id, { completed: nextCompleted, status: nextStatus });
      showToast('Milestone status updated!', 'success');
      loadGoals();
    } catch (e) {
      showToast('Failed to update milestone', 'info');
    }
  };

  const handleUpdateMilestoneStatus = async (milestone: GoalMilestone, status: MilestoneStatus) => {
    try {
      const completed = status === 'COMPLETED';
      await updateMilestone(milestone.id, { status, completed });
      showToast(`Milestone marked as ${status}`, 'success');
      loadGoals();
    } catch (e) {
      showToast('Failed to update milestone status', 'info');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createGoal({
        title: newTitle,
        category: newCategory,
        target_date: newTargetDate || undefined,
      });
      showToast('Goal created successfully!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      loadGoals();
    } catch (e) {
      showToast('Error creating goal', 'info');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            Goals & Strategic Milestones
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Goal → Milestones → Tasks. True progress derived from completed milestones and execution.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goal Cards Hierarchy List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {goals.map((goal) => {
          const isExpanded = expandedGoalId === goal.id;
          const milestones = goal.milestones || [];
          const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
          const todayGoalTasks = goalTasks.filter((t) => t.due_date === todayStr);
          const todayCompletedGoalTasks = todayGoalTasks.filter((t) => t.completed);

          const completedMilestones = milestones.filter((m) => m.completed || m.status === 'COMPLETED');
          const inProgressMilestones = milestones.filter((m) => m.status === 'IN_PROGRESS' && !m.completed);
          const currentMilestone = inProgressMilestones[0] || milestones.find((m) => !m.completed);
          const nextMilestone = milestones.filter((m) => !m.completed && m.id !== currentMilestone?.id)[0];

          // Derived Progress Calculation (Tasks contribute to Milestones, Milestones determine Goal progress)
          let progress = 0;
          if (milestones.length > 0) {
            const milestoneScores = milestones.map((m) => {
              if (m.completed || m.status === 'COMPLETED') return 1.0;
              const msTasks = goalTasks.filter((t) => t.milestone_id === m.id);
              if (msTasks.length > 0) {
                return msTasks.filter((t) => t.completed).length / msTasks.length;
              }
              return 0.0;
            });
            progress = Math.round((milestoneScores.reduce((a, b) => a + b, 0) / milestones.length) * 100);
          } else if (goalTasks.length > 0) {
            progress = Math.round((goalTasks.filter((t) => t.completed).length / goalTasks.length) * 100);
          } else {
            progress = Math.round(goal.progress_percentage || 0);
          }

          return (
            <div key={goal.id} className="bento-card" style={{ padding: '24px' }}>
              {/* Goal Card Header */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="goal-icon-badge badge-code" style={{ width: 44, height: 44 }}>
                    <Target size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>{goal.title}</h3>
                      <span className="recovery-badge" style={{ fontSize: '0.6875rem' }}>{goal.category}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '2px' }}>
                      {goal.description || 'Step-by-step milestone execution.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A' }}>
                      {progress}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {completedMilestones.length} / {milestones.length} milestones
                    </div>
                  </div>
                  <div style={{ width: 100 }}>
                    <div className="summary-progress-track">
                      <div className="summary-progress-bar bar-emerald" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
                </div>
              </div>

              {/* Milestones & Tasks Hierarchy Breakdown */}
              {isExpanded && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                  {/* Status Strip: Current & Next Milestone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>CURRENT MILESTONE</span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4F46E5', marginTop: '2px' }}>
                        {currentMilestone ? currentMilestone.title : 'All Milestones Complete 🎉'}
                      </div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>NEXT MILESTONE</span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                        {nextMilestone ? nextMilestone.title : '—'}
                      </div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B' }}>TODAY’S CONTRIBUTION</span>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                        {todayCompletedGoalTasks.length} / {todayGoalTasks.length} tasks completed
                      </div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Milestones
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {milestones.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>No milestones created yet.</p>
                    ) : (
                      milestones.map((m, idx) => {
                        const mStatus = m.status || (m.completed ? 'COMPLETED' : 'NOT_STARTED');
                        return (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              background: mStatus === 'COMPLETED' ? '#ECFDF5' : mStatus === 'BLOCKED' ? '#FEF2F2' : '#F8FAFC',
                              border: '1px solid',
                              borderColor: mStatus === 'COMPLETED' ? '#A7F3D0' : mStatus === 'BLOCKED' ? '#FECACA' : '#E2E8F0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleMilestone(m)}
                                style={{ color: m.completed ? '#10B981' : '#94A3B8', display: 'flex' }}
                              >
                                {m.completed ? <CheckCircle2 size={18} fill="#10B981" color="#ffffff" /> : <Circle size={18} />}
                              </button>
                              <span
                                style={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: m.completed ? '#047857' : '#0F172A',
                                  textDecoration: m.completed ? 'line-through' : 'none',
                                }}
                              >
                                {idx + 1}. {m.title}
                              </span>
                            </div>

                            {/* Milestone Status Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                style={{
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E8F0',
                                  background: '#ffffff',
                                  color:
                                    mStatus === 'COMPLETED'
                                      ? '#047857'
                                      : mStatus === 'IN_PROGRESS'
                                      ? '#4F46E5'
                                      : mStatus === 'BLOCKED'
                                      ? '#DC2626'
                                      : '#64748B',
                                }}
                                value={mStatus}
                                onChange={(e) => handleUpdateMilestoneStatus(m, e.target.value as MilestoneStatus)}
                              >
                                <option value="NOT_STARTED">NOT_STARTED</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="BLOCKED">BLOCKED</option>
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Linked Contributing Tasks */}
                  {goalTasks.length > 0 && (
                    <div style={{ marginTop: '18px' }}>
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Contributing Tasks ({goalTasks.length})
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {goalTasks.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              background: '#ffffff',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              color: t.completed ? '#64748B' : '#0F172A',
                              textDecoration: t.completed ? 'line-through' : 'none',
                            }}
                          >
                            <CheckSquare size={13} color={t.completed ? '#10B981' : '#6366F1'} />
                            <span>{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Create New Goal</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateGoal}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Goal Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Master Low-Level System Design"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="Career">Career</option>
                      <option value="Projects">Projects</option>
                      <option value="Academics">Academics</option>
                      <option value="Health">Health</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
