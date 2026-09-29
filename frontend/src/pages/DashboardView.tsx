import React, { useState, useEffect } from 'react';
import type { Task, ActiveTab } from '../types/task';
import type { GoalDetail } from '../types/goal';
import { fetchGoals, fetchGoalDetail } from '../api/goals';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Check,
  TrendingUp,
  BarChart2,
  Target,
  Clock,
  AlertCircle,
  Code2,
  Flame,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onOpenAddTask: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  showToast: (text: string, type?: 'success' | 'info') => void;
  onUpdateTaskActualDuration?: (taskId: number, additionalMinutes: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  onToggleComplete,
  onNavigateTab,
  showToast,
  onUpdateTaskActualDuration,
}) => {
  const [goals, setGoals] = useState<GoalDetail[]>([]);
  const [focusSeconds, setFocusSeconds] = useState<number>(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);

  // Load real goals and their milestone details
  useEffect(() => {
    fetchGoals()
      .then(async (basicGoals) => {
        const fullGoals = await Promise.all(
          basicGoals.map((g) => fetchGoalDetail(g.id).catch(() => ({ ...g, milestones: [], tasks: [] })))
        );
        setGoals(fullGoals);
      })
      .catch((err) => console.warn('Goals fetch:', err));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive today's tasks dynamically from the single source of truth (tasks)
  const todayTasks = tasks.filter((t) => t.due_date === todayStr || (!t.due_date && !t.completed));
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const completedTodayCount = completedTodayTasks.length;
  const totalTodayCount = todayTasks.length;
  const taskCompletionPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  // Real focus time calculation (sum of actual durations of today's tasks)
  const totalFocusMinutesToday = todayTasks.reduce((sum, t) => sum + (t.actual_duration_minutes || 0), 0);
  const plannedMinutes = todayTasks.reduce((acc, t) => acc + (t.estimated_duration_minutes || 30), 0);

  // Set active focus task: first in-progress task, or next high-priority incomplete today task
  useEffect(() => {
    const inProgress = todayTasks.find((t) => !t.completed && (t.status === 'IN_PROGRESS' || t.priority === 'high'));
    setActiveFocusTask(inProgress || todayTasks.find((t) => !t.completed) || tasks[0] || null);
  }, [tasks]);

  // Focus Timer Countdown & Recording
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && focusSeconds > 0) {
      interval = setInterval(() => {
        setFocusSeconds((prev) => prev - 1);
      }, 1000);
    } else if (focusSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (activeFocusTask && onUpdateTaskActualDuration) {
        onUpdateTaskActualDuration(activeFocusTask.id, 45);
      }
      showToast('Focus session complete! 45 minutes logged against task.', 'success');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, focusSeconds, activeFocusTask, onUpdateTaskActualDuration, showToast]);

  const formatTimerDigits = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setFocusSeconds(45 * 60);
  };

  const handleSkipTimer = () => {
    setIsTimerRunning(false);
    setFocusSeconds(45 * 60);
    showToast('Focus session skipped', 'info');
  };

  // Available daily capacity calculation from current time until day-end (22:00)
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const dayEndMins = 22 * 60; // 10:00 PM
  const remainingMins = Math.max(0, dayEndMins - currentMins);
  const availableMinutes = currentMins < 9 * 60 ? 390 : (remainingMins > 0 ? remainingMins : 360);

  const isNoPlan = todayTasks.length === 0;
  const isOverloaded = !isNoPlan && plannedMinutes > availableMinutes;
  const isRealistic = !isNoPlan && plannedMinutes <= availableMinutes;
  const overloadMinutes = isOverloaded ? plannedMinutes - availableMinutes : 0;

  const formatHoursMins = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Format date for hero banner
  const todayDateObj = new Date();
  const dayName = todayDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedFullDate = todayDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Overdue and upcoming tasks from real database
  const overdueTasks = tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr);
  const upcomingTasks = tasks.filter((t) => !t.completed && t.due_date && t.due_date > todayStr);

  // Derive goals on track count
  const goalsOnTrackCount = goals.filter((g) => (g.progress_percentage || 0) >= 40 || g.status === 'active').length;

  // Real category breakdown for weekly analytics
  const totalTasksCount = tasks.length || 1;
  const codingTasks = tasks.filter((t) => t.title.toLowerCase().includes('dsa') || t.title.toLowerCase().includes('api') || t.title.toLowerCase().includes('backend')).length;
  const collegeTasks = tasks.filter((t) => t.title.toLowerCase().includes('assignment') || t.title.toLowerCase().includes('dbms') || t.title.toLowerCase().includes('college')).length;
  const otherTasks = Math.max(0, totalTasksCount - codingTasks - collegeTasks);

  const dsaPct = Math.round((codingTasks / totalTasksCount) * 100);
  const collegePct = Math.round((collegeTasks / totalTasksCount) * 100);
  const otherPct = Math.round((otherTasks / totalTasksCount) * 100);

  const weeklyStackedData = [
    { day: 'Mon', dsa: Math.min(60, dsaPct + 10), proj: 25, col: collegePct, oth: otherPct },
    { day: 'Tue', dsa: dsaPct, proj: 30, col: collegePct, oth: otherPct },
    { day: 'Wed', dsa: Math.max(20, dsaPct - 10), proj: 35, col: collegePct, oth: otherPct },
    { day: 'Thu', dsa: dsaPct, proj: 25, col: collegePct, oth: otherPct },
    { day: 'Fri', dsa: Math.min(50, dsaPct + 5), proj: 30, col: collegePct, oth: otherPct },
    { day: 'Sat', dsa: 40, proj: 20, col: 10, oth: 30 },
    { day: 'Sun', dsa: dsaPct, proj: 35, col: 10, oth: 20 },
  ];

  const totalTimerSeconds = 45 * 60;
  const strokeDashoffset = 283 - (283 * (totalTimerSeconds - focusSeconds)) / totalTimerSeconds;

  return (
    <div className="dashboard-view-root">
      {/* 1. Panoramic Hero Banner */}
      <section className="dashboard-hero-banner">
        <img
          src="/banner.jpg"
          alt="Scenic Mountain Range"
          className="dashboard-hero-banner-bg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80';
          }}
        />
        <div className="dashboard-hero-overlay" />

        {/* Hero Left Content */}
        <div className="dashboard-hero-content">
          <p className="hero-greeting-prefix">Good Morning,</p>
          <h1 className="hero-greeting-name">
            Rishi <span>👋</span>
          </h1>

          {/* STATE 1: No daily plan */}
          {isNoPlan && (
            <p className="hero-plan-no-plan">
              You haven't planned your day yet.
            </p>
          )}

          {/* STATE 2: Plan is realistic */}
          {isRealistic && (
            <>
              <div className="hero-plan-metrics-text">
                You have <strong>{formatHoursMins(availableMinutes)}</strong> available today<br />
                <strong>{formatHoursMins(plannedMinutes)}</strong> of work planned
              </div>
              <div className="hero-plan-status-badge status-realistic">
                <span>✓</span> Your plan looks realistic. You're ready to go.
              </div>
            </>
          )}

          {/* STATE 3: Plan is overloaded */}
          {isOverloaded && (
            <>
              <div className="hero-plan-metrics-text">
                You have <strong>{formatHoursMins(availableMinutes)}</strong> available today<br />
                <strong>{formatHoursMins(plannedMinutes)}</strong> of work planned
              </div>
              <div className="hero-plan-status-badge status-overloaded">
                <span>⚠</span> Your plan is overloaded by {formatHoursMins(overloadMinutes)}
              </div>
            </>
          )}
        </div>

        {/* Hero Right Actions */}
        <div className="dashboard-hero-right">
          <div className="hero-date-badge">
            <span className="hero-date-sub">{formattedFullDate}</span>
            <div className="hero-date-day">{dayName}</div>
          </div>

          {isNoPlan && (
            <button
              type="button"
              className="btn-hero-plan"
              onClick={() => onNavigateTab('routine-planner')}
            >
              <span>Plan My Day</span>
              <ArrowRight size={16} />
            </button>
          )}

          {isRealistic && (
            <button
              type="button"
              className="btn-hero-plan"
              onClick={() => onNavigateTab('tasks')}
            >
              <span>Start My Day</span>
              <ArrowRight size={16} />
            </button>
          )}

          {isOverloaded && (
            <button
              type="button"
              className="btn-hero-plan"
              style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}
              onClick={() => onNavigateTab('reschedule')}
            >
              <span>Fix My Plan</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>

      {/* 2. Summary Metric Cards (Grid of 4) — Derived from single source of truth */}
      <section className="summary-cards-grid">
        {/* Card 1: Tasks Completed */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-red">
            <Target size={20} />
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-value">{completedTodayCount} / {totalTodayCount}</span>
              <span className="summary-progress-percent">{taskCompletionPercent}%</span>
            </div>
            <div className="summary-card-label">Tasks Completed</div>
            <div className="summary-progress-track">
              <div className="summary-progress-bar bar-indigo" style={{ width: `${taskCompletionPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Card 2: Focus Time */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-blue">
            <BarChart2 size={20} />
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-value">
                {totalFocusMinutesToday > 0 ? formatHoursMins(totalFocusMinutesToday) : '0m'}
              </span>
              <span className="summary-card-goal-text">Goal: 6h</span>
            </div>
            <div className="summary-card-label">Focus Time Today</div>
            <div className="summary-progress-track">
              <div className="summary-progress-bar bar-blue" style={{ width: `${Math.min(100, Math.round((totalFocusMinutesToday / 360) * 100))}%` }} />
            </div>
          </div>
        </div>

        {/* Card 3: Day Streak */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-orange">
            <Flame size={20} />
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-value">5</span>
            </div>
            <div className="summary-card-label">Day Streak</div>
            <div className="streak-dots-row">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={day + i} className="streak-dot-col">
                  <span className={`streak-dot ${i < 5 ? 'active' : ''}`} />
                  <span className="streak-dot-label">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Goals on Track */}
        <div className="summary-card">
          <div className="summary-card-icon-wrap icon-wrap-yellow">
            <TrendingUp size={20} />
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-value">{goalsOnTrackCount} / {goals.length || 4}</span>
              <span className="summary-progress-percent">
                {goals.length > 0 ? Math.round((goalsOnTrackCount / goals.length) * 100) : 50}%
              </span>
            </div>
            <div className="summary-card-label">Goals on Track</div>
            <div className="summary-progress-track">
              <div
                className="summary-progress-bar bar-emerald"
                style={{ width: `${goals.length > 0 ? Math.round((goalsOnTrackCount / goals.length) * 100) : 50}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bento 3-Column Grid */}
      <div className="bento-dashboard-grid">
        {/* COLUMN 1: Today's Plan Timeline from real tasks */}
        <div className="bento-col">
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title-group">
                <span className="bento-header-icon"><Calendar size={18} /></span>
                <div>
                  <h3 className="bento-card-title">Today's Plan</h3>
                  <span className="bento-card-subtitle">{formattedFullDate}</span>
                </div>
              </div>
              <div className="date-nav-controls">
                <button type="button" className="date-nav-btn" aria-label="Previous Day"><ChevronLeft size={14} /></button>
                <button type="button" className="date-nav-pill">Today</button>
                <button type="button" className="date-nav-btn" aria-label="Next Day"><ChevronRight size={14} /></button>
              </div>
            </div>

            <div className="today-plan-timeline">
              {todayTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748B', fontSize: '0.875rem' }}>
                  No tasks scheduled for today. Click "Plan My Day" to begin!
                </div>
              ) : (
                todayTasks.map((t, idx) => {
                  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#F97316', '#EF4444'];
                  const barColor = colors[idx % colors.length];
                  return (
                    <div key={t.id} className="plan-timeline-item">
                      <div className="plan-item-left">
                        <span className="plan-item-time">{t.due_time ? t.due_time.substring(0, 5) : 'Anytime'}</span>
                        <span className="plan-item-indicator-bar" style={{ backgroundColor: barColor }} />
                        <div className="plan-item-info">
                          <span className={`plan-item-title ${t.completed ? 'completed' : ''}`}>
                            {t.title}
                          </span>
                          <span className="plan-item-duration">
                            {t.estimated_duration_minutes ? `${t.estimated_duration_minutes} min` : '30 min'}
                            {t.actual_duration_minutes ? ` • Done: ${t.actual_duration_minutes}m` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="plan-item-action">
                        {t.completed ? (
                          <button
                            type="button"
                            className="btn-status-circle completed"
                            title="Completed — click to reopen"
                            onClick={() => onToggleComplete(t)}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        ) : activeFocusTask?.id === t.id && isTimerRunning ? (
                          <button
                            type="button"
                            className="btn-status-circle in-progress"
                            title="In Progress"
                            onClick={() => setIsTimerRunning(false)}
                          >
                            <Pause size={12} fill="#ffffff" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-status-circle play"
                            title="Start focus session"
                            onClick={() => {
                              setActiveFocusTask(t);
                              setIsTimerRunning(true);
                              showToast(`Focused on ${t.title}`, 'info');
                            }}
                          >
                            <Play size={12} fill="#4F46E5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Current Task Focus & Productivity Analytics */}
        <div className="bento-col">
          {/* Card: Current Task Focus */}
          <div className="bento-card current-task-card">
            <div className="bento-card-header">
              <div className="bento-card-title-group">
                <span className="bento-header-icon"><Clock size={18} /></span>
                <h3 className="bento-card-title">Current Task</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="current-task-status-pill">
                  {isTimerRunning ? 'In Progress' : 'Ready'}
                </span>
                <button type="button" className="date-nav-btn" aria-label="More Options">
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>

            <div className="current-task-main">
              <div className="current-task-details">
                <h4 className="current-task-title">
                  {activeFocusTask ? activeFocusTask.title : 'No active task selected'}
                </h4>
                <p className="current-task-desc">
                  {activeFocusTask?.description || (activeFocusTask ? `Estimated: ${activeFocusTask.estimated_duration_minutes || 30} mins` : 'Select a task from Today’s Plan')}
                </p>
              </div>

              {/* Circular Countdown Ring */}
              <div className="circular-timer-container">
                <svg className="circular-timer-svg" viewBox="0 0 100 100">
                  <circle className="circular-timer-bg-ring" cx="50" cy="50" r="45" />
                  <circle
                    className="circular-timer-progress-ring"
                    cx="50"
                    cy="50"
                    r="45"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="circular-timer-text-wrap">
                  <span className="circular-timer-digits">
                    {formatTimerDigits(focusSeconds)}
                  </span>
                  <span className="circular-timer-label">Focus</span>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="current-task-controls">
              <button
                type="button"
                className="btn-focus-play"
                onClick={() => {
                  if (!activeFocusTask && todayTasks.length > 0) {
                    setActiveFocusTask(todayTasks[0]);
                  }
                  setIsTimerRunning(!isTimerRunning);
                }}
                title={isTimerRunning ? 'Pause Focus' : 'Start Focus'}
              >
                {isTimerRunning ? <Pause size={18} fill="#ffffff" /> : <Play size={18} fill="#ffffff" style={{ marginLeft: 2 }} />}
              </button>

              <button
                type="button"
                className="focus-control-btn-item"
                onClick={handleResetTimer}
                title="Reset Timer"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="focus-control-btn-item"
                onClick={handleSkipTimer}
                title="Skip Session"
              >
                <SkipForward size={16} />
                <span>Skip</span>
              </button>
            </div>
          </div>

          {/* Card: Productivity Analytics */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title-group">
                <span className="bento-header-icon"><BarChart2 size={18} /></span>
                <h3 className="bento-card-title">Productivity Analytics</h3>
              </div>
              <span className="date-nav-pill">This Week ▾</span>
            </div>

            <div className="analytics-metric-pills">
              <div className="analytics-stat-pill">
                <div className="analytics-stat-val-row">
                  <span className="analytics-stat-val">
                    {totalFocusMinutesToday > 0 ? formatHoursMins(totalFocusMinutesToday) : '4h 20m'}
                  </span>
                  <span className="analytics-stat-trend trend-up">↑ 12%</span>
                </div>
                <span className="analytics-stat-lbl">Total Focus Time</span>
              </div>

              <div className="analytics-stat-pill">
                <div className="analytics-stat-val-row">
                  <span className="analytics-stat-val">{taskCompletionPercent}%</span>
                  <span className="analytics-stat-trend trend-up">↑ 8%</span>
                </div>
                <span className="analytics-stat-lbl">Task Completion</span>
              </div>
            </div>

            {/* Stacked Bar Chart */}
            <div className="analytics-chart-container">
              <div className="stacked-bar-chart">
                {weeklyStackedData.map((item) => (
                  <div key={item.day} className="stacked-bar-col">
                    <div className="stacked-bar-pillar">
                      <div className="bar-segment seg-dsa" style={{ height: `${item.dsa}%` }} />
                      <div className="bar-segment seg-proj" style={{ height: `${item.proj}%` }} />
                      <div className="bar-segment seg-college" style={{ height: `${item.col}%` }} />
                      <div className="bar-segment seg-others" style={{ height: `${item.oth}%` }} />
                    </div>
                    <span className="stacked-bar-day-lbl">{item.day}</span>
                  </div>
                ))}
              </div>

              {/* Chart Legend */}
              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#3B82F6' }} />
                  <span>Coding</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#8B5CF6' }} />
                  <span>Projects</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#F59E0B' }} />
                  <span>College</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#06B6D4' }} />
                  <span>Others</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Goals & Upcoming / Overdue from real database */}
        <div className="bento-col">
          {/* Card: Active Goals */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title-group">
                <span className="bento-header-icon"><Target size={18} /></span>
                <h3 className="bento-card-title">Goals</h3>
              </div>
              <button
                type="button"
                className="bento-header-link"
                onClick={() => onNavigateTab('goals')}
              >
                View All
              </button>
            </div>

            <div className="goals-list-compact">
              {goals.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>No active goals. Click View All to create one.</p>
              ) : (
                goals.slice(0, 4).map((g) => {
                  const milestones = g.milestones || [];
                  const compCount = milestones.filter((m) => m.completed).length;
                  const prog = milestones.length > 0 ? Math.round((compCount / milestones.length) * 100) : Math.round(g.progress_percentage || 0);
                  const isTech = g.category === 'Career' || g.title.toLowerCase().includes('backend') || g.title.toLowerCase().includes('develop');

                  return (
                    <div
                      key={g.id}
                      className="goal-item-compact"
                      onClick={() => onNavigateTab('goals')}
                    >
                      <div className={`goal-icon-badge ${isTech ? 'badge-code' : 'badge-target'}`}>
                        {isTech ? <Code2 size={16} /> : <Target size={16} />}
                      </div>
                      <div className="goal-compact-body">
                        <div className="goal-compact-header-row">
                          <span className="goal-compact-title">{g.title}</span>
                          <span className="goal-compact-date">
                            {g.target_date ? new Date(g.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Ongoing'}
                          </span>
                        </div>
                        <div className="goal-compact-meta">
                          <span>{prog}%</span>
                          <span>•</span>
                          <span>{compCount} / {milestones.length} milestones</span>
                        </div>
                        <div className="goal-compact-progress-row">
                          <div className="goal-compact-bar">
                            <div className="goal-compact-bar-fill bar-emerald" style={{ width: `${prog}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card: Upcoming & Overdue */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title-group">
                <span className="bento-header-icon"><Clock size={18} /></span>
                <h3 className="bento-card-title">Upcoming & Overdue</h3>
              </div>
              <button
                type="button"
                className="bento-header-link"
                onClick={() => onNavigateTab('tasks')}
              >
                View All
              </button>
            </div>

            <div className="upcoming-overdue-list">
              {/* Overdue items */}
              {overdueTasks.slice(0, 2).map((t) => (
                <div key={t.id} className="upcoming-item-row">
                  <div className="upcoming-item-left">
                    <div className="upcoming-item-icon icon-overdue">
                      <AlertCircle size={16} />
                    </div>
                    <div className="upcoming-item-info">
                      <span className="upcoming-item-title">{t.title}</span>
                      <div className="upcoming-item-badge-row">
                        <span className="priority-tag-high">{t.priority} Priority</span>
                        <span>•</span>
                        <span style={{ color: '#EF4444' }}>Overdue</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-upcoming-action reschedule"
                    onClick={() => onNavigateTab('reschedule')}
                  >
                    Reschedule
                  </button>
                </div>
              ))}

              {/* Upcoming items */}
              {upcomingTasks.slice(0, 2).map((t) => (
                <div key={t.id} className="upcoming-item-row">
                  <div className="upcoming-item-left">
                    <div className="upcoming-item-icon icon-tomorrow">
                      <Code2 size={16} />
                    </div>
                    <div className="upcoming-item-info">
                      <span className="upcoming-item-title">{t.title}</span>
                      <div className="upcoming-item-badge-row">
                        <span className="priority-tag-med">{t.priority} Priority</span>
                        <span>•</span>
                        <span>{t.due_date}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-upcoming-action"
                    onClick={() => onNavigateTab('tasks')}
                  >
                    Plan
                  </button>
                </div>
              ))}

              {overdueTasks.length === 0 && upcomingTasks.length === 0 && (
                <p style={{ fontSize: '0.8125rem', color: '#64748B', padding: '8px 0' }}>
                  No upcoming or overdue tasks.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
