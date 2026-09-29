import React from 'react';
import type { ActiveTab } from '../../types/task';
import { LayoutDashboard, CalendarCheck, CalendarDays, Flame, Target } from 'lucide-react';

interface MobileNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  todayCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  todayCount = 0,
}) => {
  const items = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'today' as ActiveTab, label: 'Today', icon: <CalendarCheck size={20} />, badge: todayCount },
    { id: 'habits' as ActiveTab, label: 'Habits', icon: <Flame size={20} /> },
    { id: 'goals' as ActiveTab, label: 'Goals', icon: <Target size={20} /> },
    { id: 'upcoming' as ActiveTab, label: 'Upcoming', icon: <CalendarDays size={20} /> },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => onSelectTab(item.id)}
        >
          <div className="mobile-nav-icon-wrapper">
            {item.icon}
            {item.badge ? <span className="mobile-nav-badge">{item.badge}</span> : null}
          </div>
          <span className="mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
