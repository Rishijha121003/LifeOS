import type { Goal, GoalDetail, GoalCreatePayload, GoalUpdatePayload, GoalMilestone, GoalMilestoneCreatePayload, GoalMilestoneUpdatePayload } from '../types/goal';
import type { Task } from '../types/task';

const API_BASE_URL = 'http://localhost:8000/api/v1/goals';

let fallbackGoals: GoalDetail[] = [
  {
    id: 1,
    title: 'Master Backend Architecture',
    description: 'Deep dive into FastAPI, database indexing, and distributed engine design',
    category: 'Career',
    target_date: '2026-12-31',
    status: 'active',
    progress_percentage: 50.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    milestones: [
      { id: 10, goal_id: 1, title: 'Complete LifeOS V0.3 API & DB Migration', completed: true, order_index: 1, created_at: new Date().toISOString() },
      { id: 11, goal_id: 1, title: 'Implement Microservice Cache Layer', completed: false, order_index: 2, created_at: new Date().toISOString() },
    ],
    tasks: []
  }
];

export const fetchGoals = async (category?: string, statusFilter?: string): Promise<Goal[]> => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (statusFilter) params.append('status', statusFilter);

    const res = await fetch(`${API_BASE_URL}/?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API offline, using local fallback state:', err);
    return fallbackGoals.filter((g) => {
      if (category && g.category !== category) return false;
      if (statusFilter && g.status !== statusFilter) return false;
      return true;
    });
  }
};

export const fetchGoalDetail = async (goalId: number): Promise<GoalDetail> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${goalId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API offline, using local fallback state:', err);
    const found = fallbackGoals.find((g) => g.id === goalId);
    if (!found) throw new Error('Goal not found');
    return found;
  }
};

export const createGoal = async (payload: GoalCreatePayload): Promise<Goal> => {
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API error, creating goal in fallback state:', err);
    const newGoal: GoalDetail = {
      id: Date.now(),
      title: payload.title,
      description: payload.description || null,
      category: payload.category || 'General',
      target_date: payload.target_date || null,
      status: payload.status || 'active',
      progress_percentage: 0.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones: (payload.milestones || []).map((m, idx) => ({
        id: Date.now() + idx,
        goal_id: Date.now(),
        title: m.title,
        completed: false,
        due_date: m.due_date || null,
        order_index: m.order_index || idx + 1,
        created_at: new Date().toISOString()
      })),
      tasks: []
    };
    fallbackGoals = [newGoal, ...fallbackGoals];
    return newGoal;
  }
};

export const updateGoal = async (goalId: number, payload: GoalUpdatePayload): Promise<Goal> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API error, updating goal in fallback state:', err);
    fallbackGoals = fallbackGoals.map((g) => (g.id === goalId ? { ...g, ...payload } : g));
    return fallbackGoals.find((g) => g.id === goalId)!;
  }
};

export const deleteGoal = async (goalId: number): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${goalId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('Goals API error, deleting goal in fallback state:', err);
    fallbackGoals = fallbackGoals.filter((g) => g.id !== goalId);
  }
};

export const createMilestone = async (goalId: number, payload: GoalMilestoneCreatePayload): Promise<GoalMilestone> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${goalId}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API error, adding milestone in fallback state:', err);
    const ms: GoalMilestone = {
      id: Date.now(),
      goal_id: goalId,
      title: payload.title,
      completed: false,
      due_date: payload.due_date || null,
      order_index: payload.order_index || 0,
      created_at: new Date().toISOString()
    };
    fallbackGoals = fallbackGoals.map((g) => {
      if (g.id === goalId) {
        return { ...g, milestones: [...g.milestones, ms] };
      }
      return g;
    });
    return ms;
  }
};

export const updateMilestone = async (milestoneId: number, payload: GoalMilestoneUpdatePayload): Promise<GoalMilestone> => {
  try {
    const res = await fetch(`${API_BASE_URL}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API error, updating milestone in fallback state:', err);
    let updatedMs: GoalMilestone | null = null;
    fallbackGoals = fallbackGoals.map((g) => {
      const updatedMsList = g.milestones.map((m) => {
        if (m.id === milestoneId) {
          updatedMs = { ...m, ...payload };
          return updatedMs;
        }
        return m;
      });
      return { ...g, milestones: updatedMsList };
    });
    return updatedMs!;
  }
};

export const deleteMilestone = async (milestoneId: number): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/milestones/${milestoneId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('Goals API error, deleting milestone in fallback state:', err);
    fallbackGoals = fallbackGoals.map((g) => ({
      ...g,
      milestones: g.milestones.filter((m) => m.id !== milestoneId)
    }));
  }
};

export const linkTaskToGoal = async (goalId: number, taskId: number): Promise<Task> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${goalId}/tasks/${taskId}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API error, linking task in fallback state:', err);
    throw err;
  }
};

export const unlinkTaskFromGoal = async (taskId: number): Promise<Task> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/unlink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Goals API error, unlinking task in fallback state:', err);
    throw err;
  }
};
