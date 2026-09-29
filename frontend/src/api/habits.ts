import type { Habit, HabitDetail, HabitCreatePayload, HabitUpdatePayload, HabitLog } from '../types/habit';

const API_BASE_URL = 'http://localhost:8000/api/v1/habits';

let fallbackHabits: HabitDetail[] = [
  {
    id: 1,
    title: 'Daily LeetCode Problem',
    description: 'Solve 1 algorithmic problem daily to maintain core CS skills',
    frequency_type: 'daily',
    target_days_per_week: 7,
    priority: 'high',
    archived: false,
    current_streak: 5,
    best_streak: 12,
    total_completions: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    logs: [
      { id: 101, habit_id: 1, completed_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() }
    ],
    stats: {
      current_streak: 5,
      best_streak: 12,
      total_completions: 24,
      completion_rate_30_days: 80.0
    }
  },
  {
    id: 2,
    title: '30 Mins Tech Reading',
    description: 'Read system design or backend books',
    frequency_type: 'daily',
    target_days_per_week: 5,
    priority: 'medium',
    archived: false,
    current_streak: 2,
    best_streak: 7,
    total_completions: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    logs: [],
    stats: {
      current_streak: 2,
      best_streak: 7,
      total_completions: 14,
      completion_rate_30_days: 50.0
    }
  }
];

export const fetchHabits = async (includeArchived: boolean = false): Promise<Habit[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/?include_archived=${includeArchived}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Habits API offline, using local fallback state:', err);
    return fallbackHabits.filter((h) => includeArchived || !h.archived);
  }
};

export const fetchHabitDetail = async (habitId: number): Promise<HabitDetail> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${habitId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Habits API offline, using local fallback state:', err);
    const found = fallbackHabits.find((h) => h.id === habitId);
    if (!found) throw new Error('Habit not found');
    return found;
  }
};

export const createHabit = async (payload: HabitCreatePayload): Promise<Habit> => {
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Habits API error, creating habit in fallback state:', err);
    const newHabit: HabitDetail = {
      id: Date.now(),
      title: payload.title,
      description: payload.description || null,
      frequency_type: payload.frequency_type || 'daily',
      target_days_per_week: payload.target_days_per_week || 7,
      priority: payload.priority || 'medium',
      archived: false,
      current_streak: 0,
      best_streak: 0,
      total_completions: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logs: [],
      stats: { current_streak: 0, best_streak: 0, total_completions: 0, completion_rate_30_days: 0 }
    };
    fallbackHabits = [newHabit, ...fallbackHabits];
    return newHabit;
  }
};

export const updateHabit = async (habitId: number, payload: HabitUpdatePayload): Promise<Habit> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${habitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Habits API error, updating habit in fallback state:', err);
    fallbackHabits = fallbackHabits.map((h) => (h.id === habitId ? { ...h, ...payload } : h));
    return fallbackHabits.find((h) => h.id === habitId)!;
  }
};

export const deleteHabit = async (habitId: number): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${habitId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('Habits API error, deleting habit in fallback state:', err);
    fallbackHabits = fallbackHabits.filter((h) => h.id !== habitId);
  }
};

export const logHabitCompletion = async (habitId: number, completedDate: string): Promise<HabitLog> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${habitId}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed_date: completedDate }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Habits API error, logging habit completion in fallback state:', err);
    const log: HabitLog = { id: Date.now(), habit_id: habitId, completed_date: completedDate, created_at: new Date().toISOString() };
    fallbackHabits = fallbackHabits.map((h) => {
      if (h.id === habitId) {
        const hasDate = h.logs.some((l) => l.completed_date === completedDate);
        if (!hasDate) {
          const updatedLogs = [...h.logs, log];
          return {
            ...h,
            logs: updatedLogs,
            current_streak: h.current_streak + 1,
            best_streak: Math.max(h.best_streak, h.current_streak + 1),
            total_completions: h.total_completions + 1,
          };
        }
      }
      return h;
    });
    return log;
  }
};
