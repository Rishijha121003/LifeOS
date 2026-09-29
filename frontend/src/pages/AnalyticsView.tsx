import React, { useState, useMemo } from 'react';
import type { Task } from '../types/task';
import {
  BarChart2,
  TrendingUp,
  Clock,
  Lightbulb,
  Target,
  Zap,
  Info,
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks?: Task[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks = [] }) => {
  const [period, setPeriod] = useState<'week' | 'today' | 'all'>('week');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const weekStartStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter tasks strictly by the selected analytics scope
  const periodTasks = useMemo(() => {
    if (period === 'today') {
      return tasks.filter((t) => t.due_date === todayStr || (!t.due_date && !t.completed));
    }
    if (period === 'week') {
      return tasks.filter((t) => (t.due_date && t.due_date >= weekStartStr && t.due_date <= todayStr) || (!t.due_date && t.created_at && t.created_at >= weekStartStr));
    }
    return tasks;
  }, [tasks, period, todayStr, weekStartStr]);

  const periodLabel = period === 'week' ? 'This Week' : period === 'today' ? 'Today' : 'All Time';

  // 1. Execution Overview (Scoped)
  const completedTasks = useMemo(() => periodTasks.filter((t) => t.completed), [periodTasks]);
  const totalTasksCount = periodTasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;
  const totalFocusMinutes = useMemo(
    () => periodTasks.reduce((sum, t) => sum + (t.actual_duration_minutes || 0), 0),
    [periodTasks]
  );

  // 2. Planned Workload & Real Availability (Scoped workload & Today's remaining window)
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const dayEndMins = 22 * 60; // 10:00 PM
  const availableTodayMins = Math.max(0, dayEndMins - currentMins);

  const todayIncompleteTasks = useMemo(
    () => tasks.filter((t) => !t.completed && (t.due_date === todayStr || !t.due_date)),
    [tasks, todayStr]
  );
  const plannedWorkloadTodayMins = useMemo(
    () => todayIncompleteTasks.reduce((sum, t) => sum + (t.estimated_duration_minutes || 30), 0),
    [todayIncompleteTasks]
  );
  const remainingCapacityTodayMins = Math.max(0, availableTodayMins - plannedWorkloadTodayMins);

  const periodPlannedWorkloadMins = useMemo(
    () => periodTasks.reduce((sum, t) => sum + (t.estimated_duration_minutes || 30), 0),
    [periodTasks]
  );
  const periodIncompleteWorkloadMins = useMemo(
    () => periodTasks.filter((t) => !t.completed).reduce((sum, t) => sum + (t.estimated_duration_minutes || 30), 0),
    [periodTasks]
  );

  // 3. Planning Accuracy & Execution Gap (Scoped)
  const tasksWithExecutionData = useMemo(
    () => periodTasks.filter((t) => (t.actual_duration_minutes || 0) > 0),
    [periodTasks]
  );
  const totalPlannedForExecuted = useMemo(
    () => tasksWithExecutionData.reduce((sum, t) => sum + (t.estimated_duration_minutes || 30), 0),
    [tasksWithExecutionData]
  );
  const totalActualForExecuted = useMemo(
    () => tasksWithExecutionData.reduce((sum, t) => sum + (t.actual_duration_minutes || 0), 0),
    [tasksWithExecutionData]
  );
  const executionGapMinutes = totalPlannedForExecuted - totalActualForExecuted;

  // 4. Planning Behavior Metrics (Scoped)
  const rescheduledCount = useMemo(
    () => periodTasks.filter((t) => (t.rescheduled_count || 0) > 0).length,
    [periodTasks]
  );
  const missedCount = useMemo(
    () => periodTasks.filter((t) => t.status === 'MISSED' || (!t.completed && t.due_date && t.due_date < todayStr)).length,
    [periodTasks, todayStr]
  );
  const skippedCount = useMemo(
    () => periodTasks.filter((t) => t.status === 'SKIPPED').length,
    [periodTasks]
  );

  // 5. Long & Evening task behavioral patterns for the selected period
  const longTasksInPeriod = useMemo(
    () => periodTasks.filter((t) => (t.estimated_duration_minutes || 30) >= 90),
    [periodTasks]
  );
  const longTasksRescheduledInPeriod = useMemo(
    () => longTasksInPeriod.filter((t) => (t.rescheduled_count || 0) > 0).length,
    [longTasksInPeriod]
  );

  const formatHoursMins = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card with Period Selector */}
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            Productivity & Planning Insights
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Evaluate planning realism: Planned vs Actual workload, estimation accuracy, and scheduling behavior.
          </p>
        </div>

        {/* Analytics Scope Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['week', 'today', 'all'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`date-nav-pill ${period === p ? 'active' : ''}`}
              style={{
                backgroundColor: period === p ? '#4F46E5' : '#ffffff',
                color: period === p ? '#ffffff' : '#475569',
                borderColor: period === p ? '#4F46E5' : '#E2E8F0',
                padding: '6px 14px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => setPeriod(p)}
            >
              {p === 'week' ? 'This Week' : p === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Core Planning & Execution Metrics */}
      <div className="summary-cards-grid">
        {/* Metric 1: Execution & Completion */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-blue">
            <TrendingUp size={20} />
          </div>
          <div className="summary-card-body">
            <span className="summary-card-value">
              {completionRate}%
            </span>
            <div className="summary-card-label">Task Completion ({periodLabel})</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              {completedTasks.length} / {totalTasksCount} tasks • {totalFocusMinutes}m focus
            </div>
            <div className="summary-progress-track" style={{ marginTop: '8px' }}>
              <div className="summary-progress-bar bar-indigo" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 2: Planned Workload & Capacity */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-yellow">
            <Clock size={20} />
          </div>
          <div className="summary-card-body">
            <span className="summary-card-value">
              {formatHoursMins(period === 'today' ? plannedWorkloadTodayMins : periodPlannedWorkloadMins)}
            </span>
            <div className="summary-card-label">Planned Workload ({periodLabel})</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              {period === 'today' ? (
                `Remaining: ${formatHoursMins(availableTodayMins)} • Free: ${formatHoursMins(remainingCapacityTodayMins)}`
              ) : (
                `${completedTasks.length} of ${totalTasksCount} completed • ${formatHoursMins(periodIncompleteWorkloadMins)} pending`
              )}
            </div>
            <div className="summary-progress-track" style={{ marginTop: '8px' }}>
              <div
                className="summary-progress-bar bar-yellow"
                style={{
                  width: `${
                    period === 'today'
                      ? Math.min(100, availableTodayMins > 0 ? Math.round((plannedWorkloadTodayMins / availableTodayMins) * 100) : 0)
                      : Math.min(100, totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0)
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Planning vs Execution Gap */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-red">
            <Target size={20} />
          </div>
          <div className="summary-card-body">
            <span className="summary-card-value">
              {tasksWithExecutionData.length > 0 ? (
                executionGapMinutes >= 0 ? `${formatHoursMins(executionGapMinutes)}` : `+${formatHoursMins(-executionGapMinutes)}`
              ) : '—'}
            </span>
            <div className="summary-card-label">Planning vs Execution Gap ({periodLabel})</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              {tasksWithExecutionData.length > 0
                ? `Plan: ${formatHoursMins(totalPlannedForExecuted)} • Actual: ${formatHoursMins(totalActualForExecuted)}`
                : 'No execution data yet.'}
            </div>
            <div className="summary-progress-track" style={{ marginTop: '8px' }}>
              <div
                className="summary-progress-bar bar-emerald"
                style={{
                  width: `${tasksWithExecutionData.length > 0 ? Math.min(100, totalPlannedForExecuted > 0 ? Math.round((totalActualForExecuted / totalPlannedForExecuted) * 100) : 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 4: Planning Behavior */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-orange">
            <Zap size={20} />
          </div>
          <div className="summary-card-body">
            <span className="summary-card-value">
              {rescheduledCount + missedCount + skippedCount}
            </span>
            <div className="summary-card-label">Planning Events ({periodLabel})</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
              {rescheduledCount} Rescheduled • {missedCount} Missed • {skippedCount} Skipped
            </div>
            <div className="summary-progress-track" style={{ marginTop: '8px' }}>
              <div
                className="summary-progress-bar bar-blue"
                style={{ width: `${Math.min(100, (rescheduledCount + missedCount + skippedCount) * 15)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Planning Realism & Data-Driven Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Card: Planning Accuracy */}
        <div className="bento-card">
          <div className="bento-card-header">
            <div className="bento-card-title-group">
              <span className="bento-header-icon"><BarChart2 size={18} /></span>
              <h3 className="bento-card-title">Duration Estimation Accuracy ({periodLabel})</h3>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5', marginBottom: '16px' }}>
            LifeOS compares your planned task duration against recorded focus time:
          </p>

          {tasksWithExecutionData.length < 2 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Info size={24} color="#64748B" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                Not enough data yet.
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
                Complete more focus sessions and tasks to calculate your estimation accuracy patterns.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasksWithExecutionData.slice(0, 5).map((task) => {
                const diff = (task.actual_duration_minutes || 0) - (task.estimated_duration_minutes || 30);
                const isUnder = diff > 0;
                const isExact = diff === 0;
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block' }}>
                        {task.title}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                        Plan: {task.estimated_duration_minutes || 30}m • Actual: {task.actual_duration_minutes}m
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: isExact ? '#059669' : isUnder ? '#DC2626' : '#2563EB',
                      }}
                    >
                      {isExact ? 'Exact match' : isUnder ? `+${diff}m variance` : `${diff}m faster`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card: Active Factual Insights */}
        <div className="bento-card">
          <div className="bento-card-header">
            <div className="bento-card-title-group">
              <span className="bento-header-icon" style={{ color: '#D97706' }}><Lightbulb size={18} /></span>
              <h3 className="bento-card-title">Real-Data Planning Insights ({periodLabel})</h3>
            </div>
          </div>

          {periodTasks.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Info size={24} color="#64748B" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                Not enough data yet.
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
                Keep using LifeOS to discover your planning patterns.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Factual Insight 1: Execution Ratio (Scoped) */}
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#047857' }}>
                  Execution Summary ({periodLabel})
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#065F46', marginTop: '2px' }}>
                  {completedTasks.length} of {totalTasksCount} tasks completed ({completionRate}%).
                  {rescheduledCount > 0 ? ` ${rescheduledCount} task(s) were rescheduled.` : ' No tasks were rescheduled.'}
                </p>
              </div>

              {/* Factual Insight 2: Estimation Realism (Scoped) */}
              {tasksWithExecutionData.length >= 2 ? (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1D4ED8' }}>
                    Estimation Variance ({periodLabel})
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#1E40AF', marginTop: '2px' }}>
                    Across {tasksWithExecutionData.length} completed tasks, total focus time ({formatHoursMins(totalActualForExecuted)}) differed from planned duration ({formatHoursMins(totalPlannedForExecuted)}) by {formatHoursMins(Math.abs(executionGapMinutes))}.
                  </p>
                </div>
              ) : period === 'today' ? (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400E' }}>
                    Today's Capacity Status
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#B45309', marginTop: '2px' }}>
                    {formatHoursMins(plannedWorkloadTodayMins)} planned today against {formatHoursMins(availableTodayMins)} remaining available time.
                  </p>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                    Workload Status ({periodLabel})
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '2px' }}>
                    {formatHoursMins(periodPlannedWorkloadMins)} planned across {totalTasksCount} tasks. {completedTasks.length} completed, {totalTasksCount - completedTasks.length} pending.
                  </p>
                </div>
              )}

              {/* Factual Insight 3: Long task pattern if data exists in period */}
              {longTasksInPeriod.length >= 2 && longTasksRescheduledInPeriod > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#B91C1C' }}>
                    Long Tasks Rescheduling Pattern ({periodLabel})
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#991B1B', marginTop: '2px' }}>
                    {longTasksRescheduledInPeriod} of {longTasksInPeriod.length} tasks estimated at 90+ minutes required rescheduling.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
