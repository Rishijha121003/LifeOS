import React, { useState } from 'react';
import type { Task } from '../types/task';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [currentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculation for current month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // Leading empty/prev days
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ dayNum: null, dateStr: '', isCurrentMonth: false, isToday: false });
  }
  // Days of current month
  const todayStr = new Date().toISOString().split('T')[0];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNum: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
            Schedule Calendar
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Multi-day timeline view of scheduled focus blocks, assignments, and milestones.
          </p>
        </div>
        <div className="date-nav-controls">
          <button type="button" className="date-nav-btn"><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0 8px' }}>{monthName}</span>
          <button type="button" className="date-nav-btn"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bento-card" style={{ padding: '20px' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '12px' }}>
          {daysOfWeek.map((d) => (
            <div key={d} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days Cells mapped to real database tasks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {calendarDays.map((d, index) => {
            if (!d.dayNum) {
              return <div key={index} style={{ minHeight: '100px', background: 'transparent' }} />;
            }

            const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
            const dayTasks = tasks
              .filter((t) => t.due_date === d.dateStr)
              .sort((a, b) => {
                if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
                if (a.due_time && !b.due_time) return -1;
                if (!a.due_time && b.due_time) return 1;
                return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
              });

            return (
              <div
                key={index}
                style={{
                  minHeight: '110px',
                  padding: '8px',
                  borderRadius: '12px',
                  background: d.isToday ? '#EEF2FF' : '#F8FAFC',
                  border: d.isToday ? '2px solid #6366F1' : '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: d.isToday ? 800 : 600,
                      color: d.isToday ? '#4F46E5' : '#334155',
                    }}
                  >
                    {d.dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B' }}>
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Render real tasks on this calendar day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                  {dayTasks.slice(0, 3).map((t) => {
                    const isHigh = t.priority === 'high';
                    const isDone = t.completed;
                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask && onSelectTask(t)}
                        style={{
                          background: isDone ? '#ECFDF5' : isHigh ? '#FEF2F2' : '#EEF2FF',
                          color: isDone ? '#047857' : isHigh ? '#DC2626' : '#4F46E5',
                          border: `1px solid ${isDone ? '#A7F3D0' : isHigh ? '#FECACA' : '#C7D2FE'}`,
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                        title={`${t.due_time ? t.due_time.substring(0, 5) + ' ' : ''}${t.title} (${t.estimated_duration_minutes || 30}m)`}
                      >
                        {t.due_time ? `${t.due_time.substring(0, 5)} ${t.title}` : t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <span style={{ fontSize: '0.625rem', color: '#64748B', fontWeight: 600 }}>
                      +{dayTasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
