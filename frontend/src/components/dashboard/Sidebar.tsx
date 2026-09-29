import React from 'react';
import type { ActiveTab } from '../../types/task';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  CalendarDays,
  Clock,
  BarChart2,
  Flame,
  FileText,
  Package,
  RotateCw,
  Sparkles,
  Settings,
  Rocket,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  todayCount?: number;
  rescheduleCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  todayCount = 0,
  rescheduleCount = 0,
}) => {
  const mainNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'goals' as ActiveTab,
      label: 'Goals',
      icon: <Target size={18} />,
    },
    {
      id: 'tasks' as ActiveTab,
      label: 'Tasks',
      icon: <CheckSquare size={18} />,
      badge: todayCount > 0 ? todayCount : undefined,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Calendar',
      icon: <CalendarDays size={18} />,
    },
    {
      id: 'focus' as ActiveTab,
      label: 'Focus Timer',
      icon: <Clock size={18} />,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics',
      icon: <BarChart2 size={18} />,
    },
    {
      id: 'habits' as ActiveTab,
      label: 'Habit Tracker',
      icon: <Flame size={18} />,
    },
    {
      id: 'notes' as ActiveTab,
      label: 'Notes',
      icon: <FileText size={18} />,
    },
    {
      id: 'resources' as ActiveTab,
      label: 'Resources',
      icon: <Package size={18} />,
    },
  ];

  const toolNavItems = [
    {
      id: 'routine-planner' as ActiveTab,
      label: 'Routine Planner',
      icon: <RotateCw size={17} />,
    },
    {
      id: 'reschedule' as ActiveTab,
      label: 'Smart Reschedule',
      icon: <Sparkles size={17} />,
      badge: rescheduleCount > 0 ? rescheduleCount : undefined,
    },
  ];

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      {/* Brand Logo & Tagline */}
      <div className="sidebar-brand" onClick={() => onSelectTab('dashboard')}>
        <div className="sidebar-brand-icon">
          <Layers size={22} strokeWidth={2.4} />
        </div>
        <div className="sidebar-brand-info">
          <span className="sidebar-brand-title">LifeOS</span>
          <span className="sidebar-brand-tagline">Plan less, Achieve more.</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav-group">
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id + item.label}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {item.badge !== undefined && (
                <span className="sidebar-nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tools Section */}
      <div className="sidebar-nav-group">
        <div className="sidebar-section-title">Tools</div>
        {toolNavItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
            {item.badge !== undefined && (
              <span className="sidebar-nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </div>


      {/* Upgrade Pro Banner Card */}
      <div className="sidebar-pro-card">
        <div className="sidebar-pro-header">
          <span className="sidebar-pro-icon">🚀</span>
          <div className="sidebar-pro-text">
            Build a better you, one day at a time.
          </div>
        </div>
        <button
          type="button"
          className="btn-upgrade-pro"
          onClick={() => alert('LifeOS Pro unlocks unlimited AI scheduling, deep habits & multi-calendar sync!')}
        >
          <Rocket size={14} />
          <span>Upgrade to Pro</span>
        </button>
      </div>

      {/* Settings Footer */}
      <div className="sidebar-footer">
        <button
          type="button"
          className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <span className="sidebar-nav-icon"><Settings size={18} /></span>
          <span className="sidebar-nav-label">Settings</span>
        </button>
      </div>
    </aside>
  );
};
