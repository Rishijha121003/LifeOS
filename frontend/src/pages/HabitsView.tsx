import React, { useState, useEffect } from 'react';
import type { Habit, HabitCreatePayload, HabitDetail } from '../types/habit';
import { fetchHabits, fetchHabitDetail, createHabit, updateHabit, deleteHabit, logHabitCompletion } from '../api/habits';
import { HabitCard } from '../components/dashboard/HabitCard';
import { AddHabitModal } from '../components/dashboard/AddHabitModal';
import { Plus, Flame, RefreshCw, Archive, CheckCircle2, Sparkles } from 'lucide-react';

interface HabitsViewProps {
  showToast: (text: string, type?: 'success' | 'info') => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ showToast }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitDetails, setHabitDetails] = useState<Record<number, HabitDetail>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadHabits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHabits(showArchived);
      setHabits(data);

      // Pre-fetch details for detailed streak/log tracking
      const detailsMap: Record<number, HabitDetail> = {};
      for (const h of data) {
        try {
          const detail = await fetchHabitDetail(h.id);
          detailsMap[h.id] = detail;
        } catch {
          // Ignore individual detail fetch error
        }
      }
      setHabitDetails(detailsMap);
    } catch (err: any) {
      console.error('Error fetching habits:', err);
      setError('Unable to load habits from backend engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, [showArchived]);

  const handleCreateOrUpdateHabit = async (payload: HabitCreatePayload, editingId?: number) => {
    if (editingId) {
      const updated = await updateHabit(editingId, payload);
      setHabits((prev) => prev.map((h) => (h.id === editingId ? updated : h)));
      showToast('Habit updated successfully');
    } else {
      const created = await createHabit(payload);
      setHabits((prev) => [created, ...prev]);
      showToast('New habit routine created!');
    }
    loadHabits();
  };

  const handleLogToday = async (habitId: number) => {
    try {
      await logHabitCompletion(habitId, todayStr);
      showToast('Habit logged for today! 🔥');
      loadHabits();
    } catch (err: any) {
      showToast('Failed to log habit completion', 'info');
    }
  };

  const handleToggleArchive = async (habit: Habit) => {
    try {
      const updated = await updateHabit(habit.id, { archived: !habit.archived });
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
      showToast(habit.archived ? 'Habit restored to active list' : 'Habit archived');
      loadHabits();
    } catch (err: any) {
      showToast('Failed to change archive status', 'info');
    }
  };

  const handleDeleteHabit = async (habitId: number) => {
    try {
      await deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      showToast('Habit deleted', 'info');
    } catch (err: any) {
      showToast('Failed to delete habit', 'info');
    }
  };

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  // Compute summary stats
  const totalActiveCount = activeHabits.length;
  const maxActiveStreak = activeHabits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);
  const completedTodayCount = activeHabits.filter((h) => {
    const detail = habitDetails[h.id];
    return detail?.logs?.some((l) => l.completed_date === todayStr);
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Bento Card */}
      <div className="bento-card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
              }}
            >
              <Flame size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Habits & Routines
              </h1>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '4px 0 0 0' }}>
                Build compounding consistency with deterministic streak tracking and daily progress.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '0.875rem' }}
            onClick={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} /> New Habit
          </button>
        </div>

        {/* Filter Bar Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px', borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
          <button
            type="button"
            className={`filter-tab ${!showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(false)}
            style={{ padding: '6px 14px', fontSize: '0.8125rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Active Habits ({activeHabits.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(true)}
            style={{ padding: '6px 14px', fontSize: '0.8125rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive size={14} /> Archived ({archivedHabits.length})
          </button>
        </div>
      </div>

      {/* 2. Top Section Stat Blocks */}
      {!loading && !error && !showArchived && (
        <div className="habits-summary-grid">
          {/* Active Habits Stat */}
          <div className="habit-stat-card">
            <div className="habit-stat-icon-wrapper" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <Sparkles size={20} />
            </div>
            <div className="habit-stat-content">
              <span className="habit-stat-label">Active Habits</span>
              <span className="habit-stat-value">{totalActiveCount}</span>
              <span className="habit-stat-subtext">Total tracked routines</span>
            </div>
          </div>

          {/* Max Active Streak Stat */}
          <div className="habit-stat-card">
            <div className="habit-stat-icon-wrapper" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Flame size={20} />
            </div>
            <div className="habit-stat-content">
              <span className="habit-stat-label">Max Active Streak</span>
              <span className="habit-stat-value" style={{ color: '#D97706' }}>
                {maxActiveStreak} {maxActiveStreak === 1 ? 'day' : 'days'}
              </span>
              <span className="habit-stat-subtext">Highest ongoing streak</span>
            </div>
          </div>

          {/* Logged Today Stat */}
          <div className="habit-stat-card">
            <div className="habit-stat-icon-wrapper" style={{ background: '#ECFDF5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
            <div className="habit-stat-content">
              <span className="habit-stat-label">Logged Today</span>
              <span className="habit-stat-value" style={{ color: '#059669' }}>
                {completedTodayCount} / {totalActiveCount}
              </span>
              <span className="habit-stat-subtext">
                {totalActiveCount > 0 ? Math.round((completedTodayCount / totalActiveCount) * 100) : 0}% completed today
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Loading State */}
      {loading && (
        <div className="view-loading-state" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="loading-spinner" />
          <span style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '12px' }}>Syncing Habits & Streaks...</span>
        </div>
      )}

      {/* 4. Error State */}
      {!loading && error && (
        <div className="bento-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid #FCA5A5', background: '#FEF2F2' }}>
          <p style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.875rem' }}>{error}</p>
          <button type="button" className="btn-secondary" style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={loadHabits}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* 5. Empty State */}
      {!loading && !error && habits.length === 0 && (
        <div className="bento-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Flame size={26} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
            {showArchived ? 'No archived habits' : 'No habits tracked yet'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0 0 20px 0' }}>
            {showArchived
              ? 'Archived habits will appear here.'
              : 'Build consistent daily routines and track deterministic streaks.'}
          </p>
          {!showArchived && (
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={() => {
                setEditingHabit(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Create Your First Habit
            </button>
          )}
        </div>
      )}

      {/* 6. Habits Grid */}
      {!loading && !error && habits.length > 0 && (
        <div className="habits-grid">
          {habits.map((habit) => {
            const detail = habitDetails[habit.id];
            const isLoggedToday = detail?.logs?.some((l) => l.completed_date === todayStr) || false;
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                isLoggedToday={isLoggedToday}
                onLogToday={handleLogToday}
                onEdit={(h) => {
                  setEditingHabit(h);
                  setIsModalOpen(true);
                }}
                onToggleArchive={handleToggleArchive}
                onDelete={handleDeleteHabit}
              />
            );
          })}
        </div>
      )}

      {/* Add / Edit Habit Modal */}
      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={handleCreateOrUpdateHabit}
        habitToEdit={editingHabit}
      />
    </div>
  );
};
