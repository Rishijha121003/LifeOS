import React, { useState, useMemo } from 'react';
import type { Task } from '../types/task';
import { updateTask } from '../api/tasks';
import {
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface RescheduleViewProps {
  tasks?: Task[];
  onTasksUpdated: () => void;
  showToast: (text: string, type?: 'success' | 'info') => void;
  onBackToDashboard: () => void;
}

export const RescheduleView: React.FC<RescheduleViewProps> = ({
  tasks = [],
  onTasksUpdated,
  showToast,
  onBackToDashboard,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter real recovery candidates (overdue, missed, or pending today's heavy tasks)
  const candidateTasks = useMemo(() => {
    const overdue = tasks.filter((t) => !t.completed && t.due_date && t.due_date < todayStr);
    const missed = tasks.filter((t) => !t.completed && t.status === 'MISSED');
    const pendingToday = tasks.filter((t) => !t.completed && (t.due_date === todayStr || !t.due_date));
    
    const combined = [...overdue, ...missed, ...pendingToday];
    // deduplicate by id
    const uniqueMap = new Map<number, Task>();
    combined.forEach((t) => uniqueMap.set(t.id, t));
    return Array.from(uniqueMap.values());
  }, [tasks, todayStr]);

  const [selectedTaskId, setSelectedTaskId] = useState<number>(
    candidateTasks[0]?.id || 0
  );
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const activeTask = candidateTasks.find((t) => t.id === selectedTaskId) || candidateTasks[0];

  // 1. Time remaining in the day from current time until day-end (22:00)
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const dayEndMins = 22 * 60; // 10:00 PM
  const timeRemainingToday = Math.max(0, dayEndMins - currentMins);

  // 2. Time occupied by OTHER incomplete tasks scheduled for today (excluding candidate task itself)
  const otherIncompleteTasksToday = tasks.filter(
    (t) => t.id !== activeTask?.id && !t.completed && (t.due_date === todayStr || !t.due_date)
  );
  const occupiedByOtherTasksMinutes = otherIncompleteTasksToday.reduce(
    (sum, t) => sum + (t.estimated_duration_minutes || 30),
    0
  );

  // 3. Free usable recovery capacity
  const freeRecoveryMinutes = Math.max(0, timeRemainingToday - occupiedByOtherTasksMinutes);
  const candidateDuration = activeTask?.estimated_duration_minutes || 30;
  const fitsToday = candidateDuration <= freeRecoveryMinutes && freeRecoveryMinutes > 0;

  const isDueTodayOrOverdue = activeTask && activeTask.due_date ? activeTask.due_date <= todayStr : false;
  const hasDeadlineConflict = isDueTodayOrOverdue && !fitsToday;

  const availableHoursText = freeRecoveryMinutes > 0
    ? `${Math.floor(freeRecoveryMinutes / 60)}h ${freeRecoveryMinutes % 60}m Free Today`
    : '0m Free Today (Booked)';

  const isOverdue = activeTask && activeTask.due_date && activeTask.due_date < todayStr;
  const deadlineText = isOverdue
    ? `Overdue (${activeTask.due_date})`
    : activeTask?.due_date === todayStr
    ? 'Due Today'
    : activeTask?.due_date
    ? `Due ${activeTask.due_date}`
    : 'No Hard Deadline';

  // Helper to format exact time slot range based on duration (no fake 2-hour ranges)
  const formatExactSlot = (startHour: number, startMinute: number, durationMinutes: number): string => {
    const startTotal = startHour * 60 + startMinute;
    const endTotal = startTotal + durationMinutes;

    const fmt = (m: number) => {
      const h24 = Math.floor(m / 60) % 24;
      const mins = m % 60;
      const ampm = h24 < 12 ? 'AM' : 'PM';
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      return `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`;
    };

    return `${fmt(startTotal)} - ${fmt(endTotal)}`;
  };

  // Inspect tomorrow's scheduled tasks to avoid collisions
  const tomorrowTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.due_date === tomorrowStr),
    [tasks, tomorrowStr]
  );
  const tomorrowMorningStartHour = tomorrowTasks.some((t) => t.due_time && t.due_time.startsWith('07:')) ? 8 : 7;

  const recoveryOptions = useMemo(() => {
    if (!activeTask) return [];
    const dur = activeTask.estimated_duration_minutes || 45;

    // Case A: Task fits completely in today's unallocated normal free capacity
    if (fitsToday) {
      return [
        {
          id: 'opt-tonight',
          title: 'Option 1: Tonight Focus Slot',
          badge: 'KEEP DEADLINE (NORMAL CAPACITY)',
          timeSlot: `Tonight ${formatExactSlot(20, 0, dur)}`,
          desc: `Fits into today's remaining ${availableHoursText} with zero conflict with other scheduled tasks.`,
          impact: 'Completes task today before deadline within normal working hours.',
          buttonLabel: 'Schedule Tonight',
          action: async () => {
            await updateTask(activeTask.id, {
              due_date: todayStr,
              due_time: '20:00',
              status: 'NOT_STARTED',
              rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
            });
          },
        },
        {
          id: 'opt-tomorrow-morning',
          title: 'Option 2: Tomorrow Morning Slot',
          badge: 'NEXT DAY SHIFT',
          timeSlot: `Tomorrow ${formatExactSlot(tomorrowMorningStartHour, 0, dur)}`,
          desc: `Moves the full ${dur}-minute task to tomorrow morning's first open window.`,
          impact: 'Frees up tonight and shifts execution to tomorrow.',
          buttonLabel: 'Move to Tomorrow',
          action: async () => {
            await updateTask(activeTask.id, {
              due_date: tomorrowStr,
              due_time: `${tomorrowMorningStartHour.toString().padStart(2, '0')}:00`,
              status: 'NOT_STARTED',
              rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
            });
          },
        },
      ];
    }

    // Case B: Does NOT fit today, but has >= 15m free capacity (GENUINE SPLIT FEASIBLE)
    const canSplit = freeRecoveryMinutes >= 15 && dur > freeRecoveryMinutes;
    const splitToday = freeRecoveryMinutes;
    const splitTomorrow = dur - freeRecoveryMinutes;

    if (canSplit) {
      return [
        {
          id: 'opt-split',
          title: 'Option 1: Split Across Today & Tomorrow',
          badge: 'PARTIAL PROGRESS (SPLIT)',
          timeSlot: `Today (${splitToday}m) + Tomorrow (${splitTomorrow}m)`,
          desc: `Uses today's remaining ${splitToday}m normal capacity now and schedules the remaining ${splitTomorrow}m for tomorrow morning.`,
          impact: 'Maximizes today\'s progress while respecting normal capacity limits.',
          buttonLabel: 'Apply Split Plan',
          action: async () => {
            await updateTask(activeTask.id, {
              due_date: todayStr,
              due_time: '20:00',
              status: 'IN_PROGRESS',
              rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
            });
          },
        },
        {
          id: 'opt-overtime-today',
          title: 'Option 2: Keep Today — Overtime Session',
          badge: 'OVERTIME',
          timeSlot: `Tonight ${formatExactSlot(22, 0, dur)} (Overtime)`,
          desc: `Completes all ${dur}m tonight by working beyond your configured 10:00 PM day-end.`,
          impact: `Completes the task today to meet deadline, but requires ${dur - splitToday}m of overtime.`,
          buttonLabel: 'Apply Overtime Plan',
          action: async () => {
            await updateTask(activeTask.id, {
              due_date: todayStr,
              due_time: '22:00',
              status: 'NOT_STARTED',
              rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
            });
          },
        },
        {
          id: 'opt-tomorrow-full',
          title: 'Option 3: Move & Extend Deadline to Tomorrow',
          badge: hasDeadlineConflict ? 'REQUIRES DEADLINE EXTENSION' : 'NEXT DAY SHIFT',
          timeSlot: `Tomorrow ${formatExactSlot(tomorrowMorningStartHour, 0, dur)}`,
          desc: `Today cannot fit the full ${dur}m in normal hours. Moves the entire task to tomorrow morning's open slot.`,
          impact: hasDeadlineConflict
            ? `This task is due today. Moving it to tomorrow will make it overdue unless the deadline is extended to tomorrow.`
            : 'Leaves today unburdened and dedicates a full morning block tomorrow.',
          buttonLabel: hasDeadlineConflict ? 'Move & Extend Deadline' : 'Move to Tomorrow',
          action: async () => {
            await updateTask(activeTask.id, {
              due_date: tomorrowStr,
              due_time: `${tomorrowMorningStartHour.toString().padStart(2, '0')}:00`,
              status: 'NOT_STARTED',
              rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
            });
          },
        },
      ];
    }

    // Case C: Does NOT fit today and 0m normal free capacity (EXACTLY 2 FEASIBLE STRATEGIES: OVERTIME or DEADLINE EXTENSION)
    return [
      {
        id: 'opt-overtime-today',
        title: 'Option 1: Keep Today — Overtime Session',
        badge: 'OVERTIME',
        timeSlot: `Tonight ${formatExactSlot(22, 0, dur)} (Overtime)`,
        desc: `Normal capacity is 0m. Requires ${dur}m of work beyond your configured 10:00 PM day-end.`,
        impact: `Completes the task today to meet deadline, but requires ${dur}m of overtime.`,
        buttonLabel: 'Apply Overtime Plan',
        action: async () => {
          await updateTask(activeTask.id, {
            due_date: todayStr,
            due_time: '22:00',
            status: 'NOT_STARTED',
            rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
          });
        },
      },
      {
        id: 'opt-tomorrow-morning',
        title: 'Option 2: Move & Extend Deadline to Tomorrow',
        badge: hasDeadlineConflict ? 'REQUIRES DEADLINE EXTENSION' : 'NEXT DAY SHIFT',
        timeSlot: `Tomorrow ${formatExactSlot(tomorrowMorningStartHour, 0, dur)}`,
        desc: `Today has 0m unallocated normal capacity. Moves the full ${dur}m task to tomorrow morning's open slot.`,
        impact: hasDeadlineConflict
          ? `This task is due today. Moving it to tomorrow will make it overdue unless the deadline is extended to tomorrow.`
          : 'Allocates dedicated morning focus with clean schedule.',
        buttonLabel: hasDeadlineConflict ? 'Move & Extend Deadline' : 'Move to Tomorrow',
        action: async () => {
          await updateTask(activeTask.id, {
            due_date: tomorrowStr,
            due_time: `${tomorrowMorningStartHour.toString().padStart(2, '0')}:00`,
            status: 'NOT_STARTED',
            rescheduled_count: (activeTask.rescheduled_count || 0) + 1,
          });
        },
      },
    ];
  }, [activeTask, fitsToday, freeRecoveryMinutes, availableHoursText, hasDeadlineConflict, todayStr, tomorrowStr, tomorrowMorningStartHour]);

  const handleApplyOption = async (option: typeof recoveryOptions[0]) => {
    if (!activeTask) return;
    setIsApplying(true);
    try {
      await option.action();
      showToast(`Recovery applied: ${option.title}`, 'success');
      onTasksUpdated();
    } catch (err) {
      showToast('Failed to apply recovery reschedule', 'info');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="reschedule-page-container">
      {/* Banner */}
      <div className="reschedule-hero-banner">
        <div className="reschedule-hero-text">
          <h2>Adaptive Smart Reschedule</h2>
          <p>
            Life happens and schedules shift. LifeOS calculates remaining capacity and rebalances your day intelligently.
          </p>
        </div>
        <button
          type="button"
          className="btn-hero-plan"
          onClick={onBackToDashboard}
        >
          <span>Back to Dashboard</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Missed Task Selector & Analysis */}
      {candidateTasks.length === 0 ? (
        <div className="bento-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ color: '#059669', marginBottom: '8px' }}>
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A' }}>
            All Scheduled Tasks Are On Track
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '6px' }}>
            There are no missed or overdue tasks requiring recovery rebalancing right now.
          </p>
        </div>
      ) : (
        <>
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title-group">
                <span className="bento-header-icon" style={{ color: '#EA580C' }}>
                  <ShieldAlert size={20} />
                </span>
                <h3 className="bento-card-title">Missed Task Recovery Analysis</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {candidateTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`date-nav-pill ${activeTask?.id === t.id ? 'active' : ''}`}
                    style={{
                      backgroundColor: activeTask?.id === t.id ? '#EEF2FF' : '#ffffff',
                      borderColor: activeTask?.id === t.id ? '#6366F1' : '#E2E8F0',
                      color: activeTask?.id === t.id ? '#4F46E5' : '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedTaskId(t.id)}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Analysis Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>TASK PRIORITY</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: activeTask?.priority === 'high' ? '#DC2626' : '#D97706', marginTop: '2px', textTransform: 'capitalize' }}>
                  {activeTask?.priority || 'Medium'} Priority
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>ESTIMATED DURATION</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                  {candidateDuration} mins
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>FREE CAPACITY TODAY</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: fitsToday ? '#059669' : '#DC2626', marginTop: '2px' }}>
                  {availableHoursText}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>DEADLINE STATUS</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: isOverdue || hasDeadlineConflict ? '#DC2626' : '#B45309', marginTop: '2px' }}>
                  {deadlineText}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5' }}>
              {hasDeadlineConflict && freeRecoveryMinutes === 0 ? (
                <>
                  <strong style={{ color: '#DC2626' }}>Deadline Conflict:</strong> <em>"{activeTask?.title}"</em> requires <strong>{candidateDuration}m</strong>, but <strong>0m</strong> of normal capacity remains today before your configured day-end (10:00 PM). Because the task is due today ({activeTask?.due_date}), moving it to tomorrow creates a deadline conflict. Choose whether to work overtime tonight or extend the deadline to tomorrow:
                </>
              ) : hasDeadlineConflict ? (
                <>
                  <strong style={{ color: '#DC2626' }}>Deadline Conflict:</strong> <em>"{activeTask?.title}"</em> requires <strong>{candidateDuration}m</strong>, but only <strong>{availableHoursText}</strong> remains unallocated today before day-end. Because the task is due today ({activeTask?.due_date}), a partial split or overtime is required to avoid missing the deadline:
                </>
              ) : fitsToday ? (
                <>
                  <strong>Diagnosis:</strong> <em>"{activeTask?.title}"</em> requires <strong>{candidateDuration}m</strong>. You have <strong>{availableHoursText}</strong> unallocated normal capacity today. The task fits comfortably within your workday before deadline:
                </>
              ) : (
                <>
                  <strong>Diagnosis:</strong> <em>"{activeTask?.title}"</em> requires <strong>{candidateDuration}m</strong>, but only <strong>{availableHoursText}</strong> is unallocated today. Rescheduling to tomorrow's open window is recommended to stay within realistic daily capacity:
                </>
              )}
            </p>
          </div>

          {/* Intelligent Recovery Options */}
          <div className="recovery-cards-grid">
            {recoveryOptions.map((opt) => (
              <div
                key={opt.id}
                className={`recovery-option-card ${opt.badge.includes('RECOMMENDED') || opt.badge.includes('OVERTIME') ? 'recommended' : ''}`}
              >
                <span className="recovery-badge">{opt.badge}</span>
                <h4 className="recovery-option-title">{opt.title}</h4>
                <div className="recovery-option-slot">
                  <Clock size={16} />
                  <span>{opt.timeSlot}</span>
                </div>
                <p className="recovery-option-desc">{opt.desc}</p>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  <strong>Outcome:</strong> {opt.impact}
                </div>
                <button
                  type="button"
                  className="btn-apply-recovery"
                  disabled={isApplying}
                  onClick={() => handleApplyOption(opt)}
                >
                  {isApplying ? 'Rebalancing Plan...' : opt.buttonLabel || 'Apply Reschedule Plan'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
