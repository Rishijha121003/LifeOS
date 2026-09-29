export type PriorityLevel = 'low' | 'medium' | 'high';
export type TaskExecutionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'MISSED';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  due_date?: string | null; // YYYY-MM-DD
  due_time?: string | null; // HH:MM or HH:MM:SS
  priority: PriorityLevel;
  completed: boolean;
  status?: TaskExecutionStatus;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  rescheduled_from_date?: string | null;
  rescheduled_count?: number;
  goal_id?: number | null;
  milestone_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  priority: PriorityLevel;
  status?: TaskExecutionStatus;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  goal_id?: number | null;
  milestone_id?: number | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  priority?: PriorityLevel;
  completed?: boolean;
  status?: TaskExecutionStatus;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  rescheduled_from_date?: string | null;
  rescheduled_count?: number;
  goal_id?: number | null;
  milestone_id?: number | null;
}

export type ActiveTab =
  | 'dashboard'
  | 'goals'
  | 'tasks'
  | 'routine-planner'
  | 'calendar'
  | 'focus'
  | 'analytics'
  | 'ai-assistant'
  | 'habits'
  | 'notes'
  | 'resources'
  | 'reschedule'
  | 'settings';

