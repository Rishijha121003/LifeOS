import React, { useState, useEffect } from 'react';
import type { Task } from '../types/task';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FocusViewProps {
  tasks: Task[];
  showToast: (text: string, type?: 'success' | 'info') => void;
  onRecordFocus?: (taskId: number, minutes: number) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({ tasks, showToast, onRecordFocus }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number>(tasks[0]?.id || 0);
  const [presetDuration, setPresetDuration] = useState<number>(45); // in minutes
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (tasks.length > 0 && (!selectedTaskId || !tasks.find(t => t.id === selectedTaskId))) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    setSecondsRemaining(presetDuration * 60);
    setIsActive(false);
  }, [presetDuration]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const handleReset = () => {
    const elapsedSeconds = presetDuration * 60 - secondsRemaining;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    setIsActive(false);
    setSecondsRemaining(presetDuration * 60);
    if (elapsedMinutes >= 1 && selectedTask && onRecordFocus) {
      onRecordFocus(selectedTask.id, elapsedMinutes);
      showToast(`Interrupted session: ${elapsedMinutes}m logged on "${selectedTask.title}"`, 'info');
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((s) => s - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      if (selectedTask && onRecordFocus) {
        onRecordFocus(selectedTask.id, presetDuration);
      }
      showToast(`Focus session complete! ${presetDuration} mins logged on "${selectedTask?.title || 'task'}"`, 'success');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, secondsRemaining, selectedTask, presetDuration, onRecordFocus, showToast]);

  const formatDigits = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const strokeDashoffset =
    377 - (377 * (presetDuration * 60 - secondsRemaining)) / (presetDuration * 60);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
      <div className="bento-card" style={{ width: '100%', maxWidth: '720px', textAlign: 'center', padding: '36px' }}>
        <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
          Deep Focus Workspace
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
          Connect focus execution directly to task progress.
        </p>

        {/* Task Selector */}
        <div style={{ marginTop: '20px', maxWidth: '440px', margin: '20px auto 0 auto' }}>
          <select
            className="form-select"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(Number(e.target.value))}
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} (Est: {t.estimated_duration_minutes || 30}m • Actual: {t.actual_duration_minutes || 0}m)
              </option>
            ))}
          </select>
        </div>

        {/* Duration Presets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '18px' }}>
          {[25, 45, 60, 90].map((mins) => (
            <button
              key={mins}
              type="button"
              className={`date-nav-pill ${presetDuration === mins ? 'active' : ''}`}
              style={{
                backgroundColor: presetDuration === mins ? '#4F46E5' : '#ffffff',
                color: presetDuration === mins ? '#ffffff' : '#475569',
                borderColor: presetDuration === mins ? '#4F46E5' : '#E2E8F0',
                padding: '6px 16px',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
              onClick={() => setPresetDuration(mins)}
            >
              {mins} min
            </button>
          ))}
        </div>

        {/* Large Circular Countdown Timer */}
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '32px auto' }}>
          <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" stroke="#F1F5F9" strokeWidth="8" fill="none" />
            <circle
              cx="70"
              cy="70"
              r="60"
              stroke="#4F46E5"
              strokeWidth="8"
              strokeDasharray="377"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '2.25rem', fontWeight: 800, color: '#0F172A' }}>
              {formatDigits(secondsRemaining)}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginTop: '2px' }}>
              {isActive ? 'FOCUSING' : 'READY'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <button
            type="button"
            className="btn-focus-play"
            style={{ width: 56, height: 56 }}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? <Pause size={22} fill="#ffffff" /> : <Play size={22} fill="#ffffff" style={{ marginLeft: 3 }} />}
          </button>
          <button
            type="button"
            className="focus-control-btn-item"
            onClick={handleReset}
          >
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="focus-control-btn-item"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 size={18} color="#4F46E5" /> : <VolumeX size={18} />}
            <span>Sound</span>
          </button>
        </div>
      </div>
    </div>
  );
};
