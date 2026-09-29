import React, { useState, useEffect, useMemo } from 'react';
import type { Task, PriorityLevel } from '../types/task';
import type {
  FixedCommitment,
  RoutinePlanProposalResponse,
  UnscheduledDispositionItem,
} from '../types/planning';
import {
  fetchRoutineSettings,
  proposeRoutinePlan,
  acceptRoutinePlan,
} from '../api/planning';
import { updateTask } from '../api/tasks';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Coffee,
  Briefcase,
  RotateCcw,
  CheckSquare,
  Square,
  Sliders,
  X,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface RoutinePlannerViewProps {
  tasks: Task[];
  onTasksUpdated: () => void;
  showToast: (text: string, type?: 'success' | 'info') => void;
  onNavigateTab: (tab: 'dashboard' | 'tasks' | 'calendar' | 'reschedule') => void;
}

export const RoutinePlannerView: React.FC<RoutinePlannerViewProps> = ({
  tasks,
  onTasksUpdated,
  showToast,
  onNavigateTab,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // 1. Time Available Configuration
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dayStartTime, setDayStartTime] = useState<string>(() => {
    try {
      return localStorage.getItem('lifeos_routine_day_start_time') || '07:00';
    } catch {
      return '07:00';
    }
  });
  const [dayEndTime, setDayEndTime] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('lifeos_routine_day_end_time');
      if (saved === '11:00') return '23:00';
      return saved || '23:00';
    } catch {
      return '23:00';
    }
  });

  // Fixed commitments (user defined)
  const [commitments, setCommitments] = useState<FixedCommitment[]>([]);
  const [newCommitmentTitle, setNewCommitmentTitle] = useState<string>('');
  const [newCommitmentStart, setNewCommitmentStart] = useState<string>('09:00');
  const [newCommitmentEnd, setNewCommitmentEnd] = useState<string>('14:00');
  const [isAddingCommitment, setIsAddingCommitment] = useState<boolean>(false);

  // Load user settings on mount only if local storage has no explicit preferences set
  useEffect(() => {
    fetchRoutineSettings()
      .then((settings) => {
        try {
          const hasLocalStart = localStorage.getItem('lifeos_routine_day_start_time');
          const hasLocalEnd = localStorage.getItem('lifeos_routine_day_end_time');
          if (!hasLocalStart && settings.day_start_time) {
            setDayStartTime(settings.day_start_time);
          }
          if (!hasLocalEnd && settings.day_end_time) {
            setDayEndTime(settings.day_end_time);
          }
        } catch {
          // Ignore local storage read errors
        }
      })
      .catch(() => {});
  }, []);

  // 2. Candidate Tasks (Real user tasks only)
  const candidateTasks = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          !t.completed &&
          t.status !== 'COMPLETED' &&
          t.title.trim().toLowerCase() !== 'break'
      )
      .sort((a, b) => {
        const priorityWeights: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
        const pDiff = (priorityWeights[b.priority] || 2) - (priorityWeights[a.priority] || 2);
        if (pDiff !== 0) return pDiff;
        const aDue = a.due_date || '9999';
        const bDue = b.due_date || '9999';
        return aDue.localeCompare(bDue);
      });
  }, [tasks]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // Pre-select tasks relevant to the selected date (due today, overdue, or due on selected date)
  useEffect(() => {
    if (candidateTasks.length > 0 && selectedTaskIds.length === 0) {
      const relevant = candidateTasks.filter(
        (t) =>
          t.due_date === selectedDate ||
          (t.due_date && t.due_date < selectedDate) ||
          !t.due_date
      );
      setSelectedTaskIds(
        relevant.length > 0 ? relevant.map((t) => t.id) : candidateTasks.map((t) => t.id)
      );
    }
  }, [candidateTasks, selectedDate]);

  // Planning state
  const [proposal, setProposal] = useState<RoutinePlanProposalResponse | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Unscheduled tasks dispositions
  const [unscheduledDispositions, setUnscheduledDispositions] = useState<
    Record<number, { action: 'move_tomorrow' | 'move_date' | 'backlog' | 'overtime' | 'keep_as_is'; targetDate?: string }>
  >({});

  // 3. Mathematical Calculations
  const parseMins = (t: string) => {
    const parts = t.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const dayTotalMinutes = Math.max(0, parseMins(dayEndTime) - parseMins(dayStartTime));
  
  const commitmentsMinutes = useMemo(() => {
    return commitments.reduce((acc, c) => {
      const s = Math.max(parseMins(dayStartTime), parseMins(c.start_time));
      const e = Math.min(parseMins(dayEndTime), parseMins(c.end_time));
      return acc + Math.max(0, e - s);
    }, 0);
  }, [commitments, dayStartTime, dayEndTime]);

  const availablePlanningCapacity = Math.max(0, dayTotalMinutes - commitmentsMinutes);

  // ONLY tasks with an explicit duration contribute to selected workload
  const selectedWorkloadMinutes = useMemo(() => {
    return tasks
      .filter((t) => selectedTaskIds.includes(t.id) && t.estimated_duration_minutes && t.estimated_duration_minutes > 0)
      .reduce((sum, t) => sum + (t.estimated_duration_minutes || 0), 0);
  }, [tasks, selectedTaskIds]);

  const missingDurationCount = useMemo(() => {
    return tasks.filter(
      (t) => selectedTaskIds.includes(t.id) && (!t.estimated_duration_minutes || t.estimated_duration_minutes <= 0)
    ).length;
  }, [tasks, selectedTaskIds]);

  const isOverloaded = selectedWorkloadMinutes > availablePlanningCapacity;
  const overCapacityMinutes = Math.max(0, selectedWorkloadMinutes - availablePlanningCapacity);

  const currentAvailableMinutes = proposal ? proposal.available_capacity_minutes : availablePlanningCapacity;
  const currentSelectedWorkloadMinutes = proposal ? proposal.selected_workload_minutes : selectedWorkloadMinutes;
  const currentIsOverloaded = proposal ? proposal.is_overloaded : isOverloaded;
  const currentOverCapacityMinutes = proposal ? proposal.overload_minutes : overCapacityMinutes;
  const currentRemainingMinutes = Math.max(0, currentAvailableMinutes - currentSelectedWorkloadMinutes);

  // Handlers
  const handleToggleTask = (taskId: number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    // Invalidate stale proposal if task selection changes
    if (proposal) setProposal(null);
  };

  const handleSelectAll = () => {
    setSelectedTaskIds(candidateTasks.map((t) => t.id));
    if (proposal) setProposal(null);
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds([]);
    if (proposal) setProposal(null);
  };

  const handleSetTaskDuration = async (taskId: number, duration: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateTask(taskId, { estimated_duration_minutes: duration });
      showToast(`Task duration set to ${duration}m`, 'success');
      onTasksUpdated();
      if (proposal) setProposal(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update duration', 'info');
    }
  };

  const handleAddCommitment = () => {
    if (!newCommitmentTitle.trim()) {
      showToast('Please enter a commitment title', 'info');
      return;
    }
    if (parseMins(newCommitmentEnd) <= parseMins(newCommitmentStart)) {
      showToast('End time must be after start time', 'info');
      return;
    }
    setCommitments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        title: newCommitmentTitle.trim(),
        start_time: newCommitmentStart,
        end_time: newCommitmentEnd,
      },
    ]);
    setNewCommitmentTitle('');
    setIsAddingCommitment(false);
    if (proposal) setProposal(null);
  };

  const handleRemoveCommitment = (index: number) => {
    setCommitments((prev) => prev.filter((_, i) => i !== index));
    if (proposal) setProposal(null);
  };

  // 4. Build Plan Handler
  const handleBuildPlan = async () => {
    if (selectedTaskIds.length === 0) {
      showToast('Select at least one task to build a plan', 'info');
      return;
    }
    if (dayTotalMinutes <= 0) {
      showToast('Day end time must be after day start time', 'info');
      return;
    }

    setIsBuilding(true);
    try {
      const resp = await proposeRoutinePlan({
        date: selectedDate,
        day_start_time: dayStartTime,
        day_end_time: dayEndTime,
        fixed_commitments: commitments,
        selected_task_ids: selectedTaskIds,
      });
      setProposal(resp);

      // Initialize default dispositions for unscheduled tasks
      if (resp.unscheduled_tasks && resp.unscheduled_tasks.length > 0) {
        const initialDisp: Record<number, { action: 'move_tomorrow' | 'move_date' | 'backlog' | 'overtime' | 'keep_as_is'; targetDate?: string }> = {};
        resp.unscheduled_tasks.forEach((u) => {
          initialDisp[u.task_id] = { action: 'move_tomorrow', targetDate: tomorrowStr };
        });
        setUnscheduledDispositions(initialDisp);
      } else {
        setUnscheduledDispositions({});
      }

      showToast('Proposed plan generated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate plan', 'info');
    } finally {
      setIsBuilding(false);
    }
  };

  // 5. Accept Plan Handler
  const handleAcceptPlan = async () => {
    if (!proposal) return;

    const taskItems = proposal.timeline.filter(
      (item) => item.item_type === 'task' && item.task_id != null
    );

    setIsSaving(true);
    try {
      const planItems = taskItems.map((item) => ({
        task_id: item.task_id!,
        due_date: proposal.date,
        due_time: item.start_time,
      }));

      const dispositions: UnscheduledDispositionItem[] = (proposal.unscheduled_tasks || []).map((u) => {
        const choice = unscheduledDispositions[u.task_id] || { action: 'move_tomorrow' };
        let targetDate = choice.targetDate;
        if (choice.action === 'move_tomorrow') {
          targetDate = tomorrowStr;
        }
        return {
          task_id: u.task_id,
          action: choice.action,
          target_date: targetDate || null,
        };
      });

      const res = await acceptRoutinePlan({
        plan_items: planItems,
        unscheduled_dispositions: dispositions,
      });

      showToast(res.message || 'Daily schedule accepted and saved!', 'success');
      onTasksUpdated();
      onNavigateTab('tasks');
    } catch (err: any) {
      showToast(err.message || 'Failed to save plan', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetTaskDisposition = (
    taskId: number,
    action: 'move_tomorrow' | 'move_date' | 'backlog' | 'overtime' | 'keep_as_is'
  ) => {
    setUnscheduledDispositions((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        action,
        targetDate: action === 'move_tomorrow' ? tomorrowStr : prev[taskId]?.targetDate,
      },
    }));
  };

  return (
    <div className="routine-planner-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header & Time Available Controls */}
      <div className="bento-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <RotateCcw size={18} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Plan Your Day
              </h1>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '3px 0 0 0' }}>
              Turn the work you want to do and the time you have into a realistic schedule.
            </p>
          </div>

          {/* Time Available Inline Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Date Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Calendar size={14} color="#64748B" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (proposal) setProposal(null);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              {selectedDate === todayStr && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#EEF2FF', color: '#4F46E5' }}>
                  Today
                </span>
              )}
            </div>

            {/* Inline Day Bounds */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Clock size={14} color="#64748B" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Day:</span>
                <input
                  type="text"
                  maxLength={5}
                  value={dayStartTime}
                  placeholder="07:00"
                  onChange={(e) => {
                    const val = e.target.value;
                    setDayStartTime(val);
                    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)) {
                      try {
                        localStorage.setItem('lifeos_routine_day_start_time', val);
                      } catch {}
                    }
                    if (proposal) setProposal(null);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)) {
                      const formatted = val.padStart(5, '0');
                      setDayStartTime(formatted);
                      try {
                        localStorage.setItem('lifeos_routine_day_start_time', formatted);
                      } catch {}
                    } else if (/^\d{1,2}$/.test(val)) {
                      const formatted = `${val.padStart(2, '0')}:00`;
                      setDayStartTime(formatted);
                      try {
                        localStorage.setItem('lifeos_routine_day_start_time', formatted);
                      } catch {}
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 700,
                    color: '#0F172A',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    width: '46px',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                  }}
                />
                <span style={{ color: '#94A3B8', fontWeight: 600 }}>→</span>
                <input
                  type="text"
                  maxLength={5}
                  value={dayEndTime}
                  placeholder="23:00"
                  onChange={(e) => {
                    const val = e.target.value;
                    setDayEndTime(val);
                    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)) {
                      try {
                        localStorage.setItem('lifeos_routine_day_end_time', val);
                      } catch {}
                    }
                    if (proposal) setProposal(null);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)) {
                      const formatted = val.padStart(5, '0');
                      setDayEndTime(formatted);
                      try {
                        localStorage.setItem('lifeos_routine_day_end_time', formatted);
                      } catch {}
                    } else if (/^\d{1,2}$/.test(val)) {
                      const formatted = `${val.padStart(2, '0')}:00`;
                      setDayEndTime(formatted);
                      try {
                        localStorage.setItem('lifeos_routine_day_end_time', formatted);
                      } catch {}
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 700,
                    color: '#0F172A',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    width: '46px',
                    textAlign: 'center',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Capacity Summary Card */}
      <div
        className="bento-card"
        style={{
          padding: '18px 22px',
          border: currentIsOverloaded ? '1px solid #FCA5A5' : '1px solid #E2E8F0',
          background: currentIsOverloaded
            ? 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Capacity Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Available
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                {formatHoursMins(currentAvailableMinutes)}
              </div>
            </div>

            <div style={{ height: '32px', width: '1px', background: '#E2E8F0' }} />

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Selected Work
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentIsOverloaded ? '#DC2626' : '#0F172A', marginTop: '2px' }}>
                {formatHoursMins(currentSelectedWorkloadMinutes)}
              </div>
            </div>

            <div style={{ height: '32px', width: '1px', background: '#E2E8F0' }} />

            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: currentIsOverloaded ? '#DC2626' : '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {currentIsOverloaded ? 'Over Capacity' : 'Remaining'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: currentIsOverloaded ? '#DC2626' : '#059669', marginTop: '2px' }}>
                {currentIsOverloaded ? `+${formatHoursMins(currentOverCapacityMinutes)}` : formatHoursMins(currentRemainingMinutes)}
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentIsOverloaded ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#DC2626', background: '#FEE2E2', padding: '6px 12px', borderRadius: '8px' }}>
                <AlertCircle size={15} />
                Selected work exceeds available capacity by {formatHoursMins(currentOverCapacityMinutes)}
              </div>
            ) : missingDurationCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '6px 12px', borderRadius: '8px' }}>
                <AlertTriangle size={15} />
                {missingDurationCount} task{missingDurationCount > 1 ? 's' : ''} missing duration (set duration before planning)
              </div>
            ) : currentSelectedWorkloadMinutes === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Select candidate tasks below to check feasibility.
              </div>
            ) : currentRemainingMinutes < 30 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '6px 12px', borderRadius: '8px' }}>
                <AlertTriangle size={15} />
                Tight schedule ({formatHoursMins(currentRemainingMinutes)} buffer remaining)
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#047857', background: '#ECFDF5', padding: '6px 12px', borderRadius: '8px' }}>
                <CheckCircle2 size={15} />
                Selected work fits within available capacity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Planning Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.05fr) minmax(360px, 1.25fr)', gap: '20px' }}>
        {/* Left Column: Fixed Commitments & Candidate Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Fixed Commitments */}
          <div className="bento-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={16} color="#475569" />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Fixed Commitments ({commitments.length})
                </h3>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsAddingCommitment(!isAddingCommitment)}
              >
                <Plus size={13} /> {isAddingCommitment ? 'Cancel' : 'Add Block'}
              </button>
            </div>

            {/* Inline Add Commitment Form */}
            {isAddingCommitment && (
              <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Commitment title (e.g. Classes, Meeting, Travel)"
                    value={newCommitmentTitle}
                    onChange={(e) => setNewCommitmentTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      value={newCommitmentStart}
                      onChange={(e) => setNewCommitmentStart(e.target.value)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>to</span>
                    <input
                      type="time"
                      value={newCommitmentEnd}
                      onChange={(e) => setNewCommitmentEnd(e.target.value)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.8125rem',
                      }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '5px 14px', fontSize: '0.8125rem', marginLeft: 'auto' }}
                      onClick={handleAddCommitment}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Commitments List */}
            {commitments.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8125rem', color: '#94A3B8', background: '#F8FAFC', borderRadius: '6px' }}>
                No fixed commitments added. Entire day is open for planning.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {commitments.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '1px 5px', background: '#E2E8F0', color: '#334155', borderRadius: '4px' }}>
                        {c.start_time} – {c.end_time}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>{c.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCommitment(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}
                      title="Remove commitment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Candidate Tasks */}
          <div className="bento-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Candidate Tasks ({candidateTasks.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {selectedTaskIds.length} selected ({formatHoursMins(selectedWorkloadMinutes)})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Select All
                </button>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            </div>

            {candidateTasks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                No pending tasks found. Create tasks in Tasks view to plan them.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
                {candidateTasks.map((t) => {
                  const isSelected = selectedTaskIds.includes(t.id);
                  const hasDuration = t.estimated_duration_minutes != null && t.estimated_duration_minutes > 0;
                  const isDueToday = t.due_date === selectedDate;
                  const isOverdue = t.due_date && t.due_date < selectedDate;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #818CF8' : '1px solid #E2E8F0',
                        background: isSelected ? '#EEF2FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          {isSelected ? (
                            <CheckSquare size={16} color="#4F46E5" />
                          ) : (
                            <Square size={16} color="#94A3B8" />
                          )}
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                              {hasDuration ? (
                                <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                                  {t.estimated_duration_minutes} min
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <AlertTriangle size={10} /> No duration
                                </span>
                              )}
                              {isDueToday && (
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '1px 4px', borderRadius: '3px' }}>
                                  Due Today
                                </span>
                              )}
                              {isOverdue && (
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '1px 4px', borderRadius: '3px' }}>
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background:
                              t.priority === 'high'
                                ? '#FEE2E2'
                                : t.priority === 'medium'
                                ? '#FEF3C7'
                                : '#F1F5F9',
                            color:
                              t.priority === 'high'
                                ? '#DC2626'
                                : t.priority === 'medium'
                                ? '#D97706'
                                : '#475569',
                          }}
                        >
                          {t.priority}
                        </span>
                      </div>

                      {/* Quick Duration Selector if Duration is missing */}
                      {!hasDuration && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            background: '#FFFBEB',
                            borderRadius: '6px',
                            border: '1px dashed #FDE68A',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span style={{ fontSize: '0.6875rem', color: '#92400E', fontWeight: 600 }}>
                            Set duration:
                          </span>
                          {[15, 30, 45, 60].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={(e) => handleSetTaskDuration(t.id, mins, e)}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                background: '#FFFFFF',
                                border: '1px solid #D97706',
                                color: '#B45309',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Build My Plan Primary Action */}
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                }}
                disabled={isBuilding || selectedTaskIds.length === 0}
                onClick={handleBuildPlan}
              >
                <Sparkles size={16} />
                {isBuilding ? 'Building Schedule...' : proposal ? 'Rebuild My Plan' : 'Build My Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Proposed Schedule Timeline & Unscheduled Resolution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!proposal ? (
            /* Empty State */
            <div
              className="bento-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '380px',
                textAlign: 'center',
                padding: '32px 20px',
                border: '2px dashed #E2E8F0',
                background: '#FAFAFA',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  marginBottom: '14px',
                }}
              >
                <Layers size={24} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Build Your One-Day Plan
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', maxWidth: '320px', marginTop: '6px', marginBottom: '18px' }}>
                Select candidate tasks and confirm your fixed blocks, then click <strong>Build My Plan</strong> to construct your timeline.
              </p>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color="#10B981" /> No Overlaps
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color="#10B981" /> Smart Breaks
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color="#10B981" /> Deadline Guard
                </span>
              </div>
            </div>
          ) : (
            /* Proposed Plan Review Area */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Proposed Timeline Blocks */}
              <div className="bento-card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Proposed Schedule Timeline
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {proposal.timeline.length} scheduled blocks • {formatHoursMins(proposal.scheduled_workload_minutes)} planned work
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: '4px' }}>
                    {proposal.date}
                  </span>
                </div>

                {/* Chronological List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {proposal.timeline.map((item, index) => {
                    const isTask = item.item_type === 'task';
                    const isCommitment = item.item_type === 'commitment';
                    const isBreak = item.item_type === 'break';

                    return (
                      <div
                        key={item.id || index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isTask
                            ? '1px solid #E2E8F0'
                            : isCommitment
                            ? '1px solid #CBD5E1'
                            : '1px dashed #CBD5E1',
                          background: isTask
                            ? '#FFFFFF'
                            : isCommitment
                            ? '#F8FAFC'
                            : '#FAFAFA',
                        }}
                      >
                        {/* Time Slot Pill */}
                        <div
                          style={{
                            minWidth: '95px',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: isTask ? '#4F46E5' : isCommitment ? '#334155' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={12} />
                          {item.start_time} – {item.end_time}
                        </div>

                        {/* Block Type Icon */}
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '5px',
                            background: isTask
                              ? '#EEF2FF'
                              : isCommitment
                              ? '#E2E8F0'
                              : '#FEF3C7',
                            color: isTask
                              ? '#4F46E5'
                              : isCommitment
                              ? '#475569'
                              : '#D97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isTask && <CheckCircle2 size={14} />}
                          {isCommitment && <Briefcase size={13} />}
                          {isBreak && <Coffee size={13} />}
                        </div>

                        {/* Title and details (NO redundant priority badges here as per spec) */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                              {item.title}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                              ({item.duration_minutes}m)
                            </span>
                          </div>

                          {isTask && (item.goal_title || item.milestone_title) && (
                            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '1px' }}>
                              {item.goal_title} {item.milestone_title ? `• ${item.milestone_title}` : ''}
                            </div>
                          )}
                        </div>

                        {/* Category Label */}
                        <div>
                          {isCommitment && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#475569', background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>
                              Fixed Block
                            </span>
                          )}
                          {isBreak && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>
                              Break
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Unscheduled Tasks Resolution Card */}
              {proposal.unscheduled_tasks && proposal.unscheduled_tasks.length > 0 && (
                <div className="bento-card" style={{ padding: '16px 18px', border: '1px solid #FECACA', background: '#FFF5F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#991B1B', margin: 0 }}>
                      {proposal.unscheduled_tasks.length} Task{proposal.unscheduled_tasks.length > 1 ? 's' : ''} Could Not Be Scheduled
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#7F1D1D', margin: '0 0 10px 0' }}>
                    These tasks do not fit in today's available time. Select what to do with each task before accepting:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {proposal.unscheduled_tasks.map((u) => {
                      const currentDisp = unscheduledDispositions[u.task_id] || { action: 'move_tomorrow' };
                      const isDueTodayOrOverdue = u.is_deadline_risk;
                      const isMissingDuration = !u.estimated_duration_minutes || u.estimated_duration_minutes <= 0;

                      return (
                        <div
                          key={u.task_id}
                          style={{
                            padding: '10px 12px',
                            background: '#FFFFFF',
                            borderRadius: '8px',
                            border: '1px solid #FCA5A5',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                                  {u.title}
                                </span>
                                {!isMissingDuration ? (
                                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                                    ({u.estimated_duration_minutes} min)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 700 }}>
                                    (No duration)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: isMissingDuration || u.is_deadline_risk ? '#DC2626' : '#64748B', marginTop: '1px' }}>
                                {u.reason}
                              </div>
                            </div>

                            {/* Deadline warning */}
                            {isDueTodayOrOverdue && currentDisp.action === 'move_tomorrow' && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 5px', borderRadius: '4px' }}>
                                Requires Deadline Extension
                              </span>
                            )}
                          </div>

                          {/* Quick Duration Selector if Missing Duration */}
                          {isMissingDuration ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
                              <span style={{ fontSize: '0.6875rem', color: '#92400E', fontWeight: 600 }}>
                                Set duration to plan:
                              </span>
                              {[15, 30, 45, 60].map((mins) => (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={(e) => handleSetTaskDuration(u.task_id, mins, e)}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    background: '#FFFFFF',
                                    border: '1px solid #D97706',
                                    color: '#B45309',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {mins}m
                                </button>
                              ))}
                            </div>
                          ) : (
                            /* Disposition Actions */
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid #F1F5F9' }}>
                              <button
                                type="button"
                                onClick={() => handleSetTaskDisposition(u.task_id, 'move_tomorrow')}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: currentDisp.action === 'move_tomorrow' ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                                  background: currentDisp.action === 'move_tomorrow' ? '#EEF2FF' : '#FFFFFF',
                                  color: currentDisp.action === 'move_tomorrow' ? '#4F46E5' : '#475569',
                                  cursor: 'pointer',
                                }}
                              >
                                Move to Tomorrow
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetTaskDisposition(u.task_id, 'backlog')}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: currentDisp.action === 'backlog' ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                                  background: currentDisp.action === 'backlog' ? '#EEF2FF' : '#FFFFFF',
                                  color: currentDisp.action === 'backlog' ? '#4F46E5' : '#475569',
                                  cursor: 'pointer',
                                }}
                              >
                                Return to Backlog
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetTaskDisposition(u.task_id, 'overtime')}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: currentDisp.action === 'overtime' ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                                  background: currentDisp.action === 'overtime' ? '#EEF2FF' : '#FFFFFF',
                                  color: currentDisp.action === 'overtime' ? '#4F46E5' : '#475569',
                                  cursor: 'pointer',
                                }}
                              >
                                Extend Day / Overtime
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetTaskDisposition(u.task_id, 'keep_as_is')}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  borderRadius: '4px',
                                  border: currentDisp.action === 'keep_as_is' ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                                  background: currentDisp.action === 'keep_as_is' ? '#EEF2FF' : '#FFFFFF',
                                  color: currentDisp.action === 'keep_as_is' ? '#4F46E5' : '#475569',
                                  cursor: 'pointer',
                                }}
                              >
                                Keep Pending
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. Accept Plan Action Bar */}
              <div
                className="bento-card"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
                  onClick={() => setProposal(null)}
                >
                  <X size={14} /> Discard
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem' }}
                    onClick={() => {
                      setProposal(null);
                      showToast('Adjust tasks or time on the left, then click Rebuild.', 'info');
                    }}
                  >
                    <Sliders size={14} /> Adjust Tasks
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    disabled={isSaving}
                    onClick={handleAcceptPlan}
                  >
                    <CheckCircle2 size={15} />
                    {isSaving ? 'Saving...' : 'Accept Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
