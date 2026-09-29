import type { Task, TaskCreatePayload, TaskUpdatePayload } from '../types/task';

const API_BASE_URL = 'http://localhost:8000/api/v1/tasks';

// In-memory initial seed state for offline/fallback mode
let fallbackTasks: Task[] = [
  {
    id: 1,
    title: 'DSA Practice',
    description: 'Sliding Window — LeetCode problems 209 & 3',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '18:00',
    priority: 'high',
    completed: false,
    estimated_duration_minutes: 45,
    rescheduled_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'FastAPI API Integration',
    description: 'Complete task CRUD endpoint integration in frontend',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '16:00',
    priority: 'medium',
    completed: true,
    estimated_duration_minutes: 30,
    rescheduled_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'LifeOS UI Polish',
    description: 'Refine task list components, cards, and stat widgets',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '20:00',
    priority: 'medium',
    completed: false,
    estimated_duration_minutes: 60,
    rescheduled_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'System Architecture Review',
    description: 'Prepare database schema review for PostgreSQL migration',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    due_time: '10:00',
    priority: 'low',
    completed: false,
    estimated_duration_minutes: 30,
    rescheduled_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const fetchTasks = async (view?: string, priority?: string): Promise<Task[]> => {
  try {
    const params = new URLSearchParams();
    if (view) params.append('view', view);
    if (priority) params.append('priority', priority);

    const res = await fetch(`${API_BASE_URL}/?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Task[] = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend API offline or unreachable, using local fallback state:', err);
    let filtered = [...fallbackTasks];
    if (view === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((t) => t.due_date === todayStr);
    } else if (view === 'upcoming') {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter((t) => !t.completed && (t.due_date ? t.due_date > todayStr : true));
    } else if (view === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }
    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }
    return filtered;
  }
};

export const createTask = async (payload: TaskCreatePayload): Promise<Task> => {
  try {
    const res = await fetch(`${API_BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: Task = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend API error, creating task in fallback state:', err);
    const newTask: Task = {
      id: Date.now(),
      title: payload.title,
      description: payload.description || null,
      due_date: payload.due_date || new Date().toISOString().split('T')[0],
      due_time: payload.due_time || '18:00',
      priority: payload.priority,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fallbackTasks = [newTask, ...fallbackTasks];
    return newTask;
  }
};

export const updateTask = async (taskId: number, payload: TaskUpdatePayload): Promise<Task> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend API error, updating task in fallback state:', err);
    fallbackTasks = fallbackTasks.map((t) => (t.id === taskId ? { ...t, ...payload } : t));
    return fallbackTasks.find((t) => t.id === taskId)!;
  }
};

export const completeTask = async (taskId: number): Promise<Task> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${taskId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend API error, completing task in fallback state:', err);
    fallbackTasks = fallbackTasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
    return fallbackTasks.find((t) => t.id === taskId)!;
  }
};

export const reopenTask = async (taskId: number): Promise<Task> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${taskId}/reopen`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend API error, reopening task in fallback state:', err);
    fallbackTasks = fallbackTasks.map((t) => (t.id === taskId ? { ...t, completed: false } : t));
    return fallbackTasks.find((t) => t.id === taskId)!;
  }
};

export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE_URL}/${taskId}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('Backend API error, deleting task from fallback state:', err);
    fallbackTasks = fallbackTasks.filter((t) => t.id !== taskId);
  }
};
