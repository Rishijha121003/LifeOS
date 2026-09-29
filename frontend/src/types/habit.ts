export type HabitFrequency = 'daily' | 'weekly';
export type HabitPriority = 'low' | 'medium' | 'high';

export interface HabitLog {
  id: number;
  habit_id: number;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface HabitStats {
  current_streak: number;
  best_streak: number;
  total_completions: number;
  completion_rate_30_days: number;
}

export interface Habit {
  id: number;
  title: string;
  description?: string | null;
  frequency_type: HabitFrequency;
  target_days_per_week: number;
  priority: HabitPriority;
  archived: boolean;
  current_streak: number;
  best_streak: number;
  total_completions: number;
  created_at: string;
  updated_at: string;
}

export interface HabitDetail extends Habit {
  logs: HabitLog[];
  stats: HabitStats;
}

export interface HabitCreatePayload {
  title: string;
  description?: string | null;
  frequency_type?: HabitFrequency;
  target_days_per_week?: number;
  priority?: HabitPriority;
}

export interface HabitUpdatePayload {
  title?: string;
  description?: string | null;
  frequency_type?: HabitFrequency;
  target_days_per_week?: number;
  priority?: HabitPriority;
  archived?: boolean;
}
