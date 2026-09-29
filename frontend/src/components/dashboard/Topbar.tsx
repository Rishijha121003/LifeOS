import React from 'react';
import { Search, Plus, Bell, ChevronDown } from 'lucide-react';

interface TopbarProps {
  title?: string;
  onOpenAddTask: () => void;
  onOpenSearch?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenAddTask,
  onOpenSearch,
}) => {
  return (
    <header className="app-topbar">
      {/* Search Bar with Ctrl+K shortcut */}
      <div className="topbar-search-box" onClick={onOpenSearch}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search goals, tasks, notes..."
          readOnly
          onClick={onOpenSearch}
        />
        <span className="kbd-badge">Ctrl K</span>
      </div>

      {/* Topbar Actions */}
      <div className="topbar-actions">
        {/* + New Button */}
        <button
          type="button"
          className="btn-topbar-new"
          onClick={onOpenAddTask}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          type="button"
          className="topbar-icon-btn"
          aria-label="Notifications"
          onClick={() => alert('No new urgent notifications. All systems on track!')}
        >
          <Bell size={18} />
          <span className="topbar-badge-dot" />
        </button>

        {/* User Profile */}
        <div className="topbar-user-profile" title="Rishi Jha (Student & Developer)">
          <div className="topbar-avatar">
            <span>R</span>
          </div>
          <div className="topbar-username">
            <span>Rishi Jha</span>
            <ChevronDown size={14} color="#64748B" />
          </div>
        </div>
      </div>
    </header>
  );
};
