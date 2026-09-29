import React, { useState, useEffect } from 'react';
import type { ActiveTab, Task } from '../../types/task';
import {
  Search,
  LayoutDashboard,
  Target,
  CheckSquare,
  Clock,
  BarChart2,
  Sparkles,
  Bot,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddTask: () => void;
  tasks: Task[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAddTask,
  tasks,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open in parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Go to Dashboard', icon: <LayoutDashboard size={16} />, action: () => { onSelectTab('dashboard'); onClose(); } },
    { label: 'Routine Planner (Plan Day)', icon: <Clock size={16} />, action: () => { onSelectTab('routine-planner'); onClose(); } },
    { label: 'View Goals & Milestones', icon: <Target size={16} />, action: () => { onSelectTab('goals'); onClose(); } },
    { label: 'Today’s Plan Timeline', icon: <CheckSquare size={16} />, action: () => { onSelectTab('tasks'); onClose(); } },
    { label: 'Deep Focus Timer', icon: <Clock size={16} />, action: () => { onSelectTab('focus'); onClose(); } },
    { label: 'Smart Reschedule Plan', icon: <Sparkles size={16} />, action: () => { onSelectTab('reschedule'); onClose(); } },
    { label: 'Productivity Analytics', icon: <BarChart2 size={16} />, action: () => { onSelectTab('analytics'); onClose(); } },
    { label: 'AI Assistant Copilot', icon: <Bot size={16} />, action: () => { onSelectTab('ai-assistant'); onClose(); } },
    { label: 'Create New Task', icon: <Plus size={16} />, action: () => { onClose(); onOpenAddTask(); } },
  ];


  const filteredNav = quickNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const matchedTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', gap: '12px' }}>
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search goals, tasks, navigation shortcuts..."
            style={{ border: 'none', outline: 'none', fontSize: '1rem', width: '100%', color: '#0F172A' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="kbd-badge">ESC</span>
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '360px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', padding: '6px 12px', textTransform: 'uppercase' }}>
            Navigation & Actions
          </div>
          {filteredNav.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#334155',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EEF2FF';
                e.currentTarget.style.color = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#334155';
              }}
              onClick={item.action}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              <ArrowRight size={14} color="#94A3B8" />
            </div>
          ))}

          {matchedTasks.length > 0 && (
            <>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', padding: '10px 12px 4px 12px', textTransform: 'uppercase' }}>
                Matching Tasks
              </div>
              {matchedTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                  }}
                  onClick={() => {
                    onSelectTab('tasks');
                    onClose();
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{t.title}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>{t.priority} priority</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
