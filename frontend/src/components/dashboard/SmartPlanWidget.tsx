import React, { useState, useEffect, useCallback } from 'react';
import type { ReplanSuggestion, TaskRecommendation } from '../../types/planning';
import type { Task } from '../../types/task';
import { fetchPlanningSuggestion, applyPlanningPlan } from '../../api/planning';
import { ApplyPlanModal } from './ApplyPlanModal';
import { Zap, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Clock, ArrowRight, EyeOff } from 'lucide-react';

interface SmartPlanWidgetProps {
  tasks: Task[];
  onPlanApplied: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'info') => void;
}

export const SmartPlanWidget: React.FC<SmartPlanWidgetProps> = ({
  tasks,
  onPlanApplied,
  showToast,
}) => {
  const [suggestion, setSuggestion] = useState<ReplanSuggestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayTasks = tasks.filter((t) => t.due_date === todayStr || !t.due_date);
  const pendingTodayTasks = todayTasks.filter((t) => !t.completed);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);

  const loadSuggestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlanningSuggestion();
      setSuggestion(data);
    } catch (err: unknown) {
      console.warn('Backend planning API unreachable, calculating local fallback recommendation:', err);
      // Fallback calculation for offline / seamless UI robustness
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const formattedCurrentTime = `${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}`;
      
      const dayEndTime = '23:00';
      const availableMins = Math.max(0, (23 - currentHours) * 60 - currentMins);

      let totalAllocated = 0;
      const doNow: TaskRecommendation[] = [];
      const moveToTomorrow: TaskRecommendation[] = [];

      for (const task of pendingTodayTasks) {
        const duration = task.estimated_duration_minutes || 30;
        if (totalAllocated + duration <= availableMins) {
          totalAllocated += duration;
          doNow.push({
            id: task.id,
            title: task.title,
            priority: task.priority,
            estimated_duration_minutes: duration,
            due_time: task.due_time,
            reason: `${duration} min task fits within remaining ${availableMins} min window tonight.`,
            score: task.priority === 'high' ? 300 : task.priority === 'medium' ? 200 : 100,
          });
        } else {
          moveToTomorrow.push({
            id: task.id,
            title: task.title,
            priority: task.priority,
            estimated_duration_minutes: duration,
            due_time: task.due_time,
            reason: `Exceeds remaining available capacity (${availableMins - totalAllocated} min remaining).`,
            score: task.priority === 'high' ? 300 : task.priority === 'medium' ? 200 : 100,
          });
        }
      }

      setSuggestion({
        current_time: formattedCurrentTime,
        day_end_time: dayEndTime,
        available_minutes: availableMins,
        summary: `You have ${availableMins} minutes available tonight. ${doNow.length} task(s) fit into your schedule; ${moveToTomorrow.length} recommended for tomorrow.`,
        do_now: doNow,
        move_to_tomorrow: moveToTomorrow,
      });
    } finally {
      setLoading(false);
    }
  }, [pendingTodayTasks]);

  useEffect(() => {
    loadSuggestion();
  }, [tasks.length]); // Refresh suggestion whenever task count changes

  const handleApplyConfirm = async () => {
    if (!suggestion || suggestion.move_to_tomorrow.length === 0) return;
    setIsApplying(true);
    try {
      const taskIds = suggestion.move_to_tomorrow.map((t) => t.id);
      await applyPlanningPlan({
        reschedule_task_ids: taskIds,
        target_date: tomorrowStr,
      });
      showToast(`Rescheduled ${taskIds.length} task(s) to tomorrow successfully!`, 'success');
      setIsApplyModalOpen(false);
      await onPlanApplied();
      await loadSuggestion();
    } catch (err: unknown) {
      console.error('Failed to apply plan:', err);
      showToast(err instanceof Error ? err.message : 'Failed to apply recommendation', 'info');
    } finally {
      setIsApplying(false);
    }
  };

  if (isDismissed) return null;

  // Render State 1: LOADING
  if (loading) {
    return (
      <div className="smart-plan-widget smart-plan-loading">
        <div className="smart-plan-header">
          <div className="skeleton-title" />
        </div>
        <div className="skeleton-cards">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  // Render State 2: ERROR
  if (error) {
    return (
      <div className="smart-plan-widget smart-plan-error">
        <div className="smart-plan-status-content">
          <AlertCircle size={20} className="status-icon icon-error" />
          <div>
            <h3 className="status-title">Couldn't generate your plan</h3>
            <p className="status-text">{error}</p>
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadSuggestion}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // Render State 3: NO TASKS scheduled for today
  if (todayTasks.length === 0) {
    return (
      <div className="smart-plan-widget smart-plan-empty">
        <div className="smart-plan-status-content">
          <Sparkles size={20} className="status-icon icon-indigo" />
          <div>
            <h3 className="status-title">All clear</h3>
            <p className="status-text">No pending tasks for today. Take a break or add a new task!</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-dismiss-text"
          onClick={() => setIsDismissed(true)}
          title="Dismiss widget"
        >
          <EyeOff size={14} /> Dismiss
        </button>
      </div>
    );
  }

  // Render State 4: ALL COMPLETED today
  if (pendingTodayTasks.length === 0 && completedTodayTasks.length > 0) {
    return (
      <div className="smart-plan-widget smart-plan-completed">
        <div className="smart-plan-status-content">
          <CheckCircle2 size={20} className="status-icon icon-success" />
          <div>
            <h3 className="status-title">Great job!</h3>
            <p className="status-text">You've completed today's plan ({completedTodayTasks.length} tasks completed).</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-dismiss-text"
          onClick={() => setIsDismissed(true)}
          title="Dismiss widget"
        >
          <EyeOff size={14} /> Dismiss
        </button>
      </div>
    );
  }

  const doNowList = suggestion?.do_now || [];
  const moveToTomorrowList = suggestion?.move_to_tomorrow || [];
  const noRescheduleNeeded = moveToTomorrowList.length === 0;

  return (
    <>
      <div className="smart-plan-widget">
        {/* Header Bar */}
        <div className="smart-plan-header">
          <div className="smart-plan-title-block">
            <div className="smart-plan-badge">
              <Zap size={15} /> Smart Daily Plan
            </div>
            <span className="smart-plan-time-meta">
              It's <strong>{suggestion?.current_time || '9:00 PM'}</strong> · ~
              <strong>{suggestion?.available_minutes ?? 120} min</strong> available until{' '}
              <strong>{suggestion?.day_end_time || '23:00'}</strong>
            </span>
          </div>

          <button
            type="button"
            className="btn-dismiss-icon"
            onClick={() => setIsDismissed(true)}
            title="Dismiss Smart Plan for this session"
            aria-label="Dismiss Smart Plan widget"
          >
            <EyeOff size={16} />
          </button>
        </div>

        <p className="smart-plan-summary">{suggestion?.summary}</p>

        {/* State 5: NO RESCHEDULING NEEDED */}
        {noRescheduleNeeded ? (
          <div className="smart-plan-no-reschedule-banner">
            <CheckCircle2 size={18} className="icon-success" />
            <span>
              <strong>You're on track!</strong> All {doNowList.length} remaining tasks fit comfortably into tonight's schedule.
            </span>
          </div>
        ) : (
          /* Main Recommendation Grid */
          <div className="smart-plan-sections-grid">
            {/* DO TONIGHT */}
            <div className="smart-plan-column">
              <div className="column-label label-do-now">
                <span>DO TONIGHT</span>
                <span className="column-count">{doNowList.length}</span>
              </div>
              <div className="recommendation-cards-list">
                {doNowList.map((task) => (
                  <div key={task.id} className="recommendation-card card-do-now">
                    <div className="card-top-row">
                      <span className="task-name">{task.title}</span>
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="card-meta-row">
                      <span className="meta-duration">
                        <Clock size={13} /> {task.estimated_duration_minutes} min
                      </span>
                      {task.due_time && <span className="meta-time">Due {task.due_time}</span>}
                    </div>
                    <p className="card-reason">{task.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RECOMMENDED FOR TOMORROW */}
            <div className="smart-plan-column">
              <div className="column-label label-tomorrow">
                <span>RECOMMENDED FOR TOMORROW</span>
                <span className="column-count">{moveToTomorrowList.length}</span>
              </div>
              <div className="recommendation-cards-list">
                {moveToTomorrowList.map((task) => (
                  <div key={task.id} className="recommendation-card card-tomorrow">
                    <div className="card-top-row">
                      <span className="task-name">{task.title}</span>
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="card-meta-row">
                      <span className="meta-duration">
                        <Clock size={13} /> {task.estimated_duration_minutes} min
                      </span>
                      <span className="meta-target">
                        <ArrowRight size={13} /> Tomorrow
                      </span>
                    </div>
                    <p className="card-reason">{task.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="smart-plan-actions">
          {!noRescheduleNeeded && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsApplyModalOpen(true)}
              >
                <Sparkles size={16} /> Apply Recommended Plan
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsApplyModalOpen(true)}
              >
                Review Plan
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ApplyPlanModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onConfirm={handleApplyConfirm}
        tasksToMove={moveToTomorrowList}
        targetDate={tomorrowStr}
        isApplying={isApplying}
      />
    </>
  );
};
