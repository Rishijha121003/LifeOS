export interface CompletionRateStats {
  rate_7_days: number;
  rate_30_days: number;
  total_completed_7_days: number;
  total_scheduled_7_days: number;
  total_completed_30_days: number;
  total_scheduled_30_days: number;
}

export interface PriorityDistribution {
  high_completed: number;
  high_pending: number;
  medium_completed: number;
  medium_pending: number;
  low_completed: number;
  low_pending: number;
}

export interface WorkloadVsCapacityStats {
  estimated_workload_minutes_today: number;
  available_capacity_minutes_today: number;
  capacity_variance_minutes: number;
}

export interface HabitConsistencyStats {
  total_habits: number;
  active_habits: number;
  average_current_streak: number;
  overall_30_day_completion_rate: number;
}

export interface GoalProgressSummary {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  average_goal_progress_percentage: number;
}

export interface ProductivityInsight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  explanation: string;
  supporting_data?: Record<string, any>;
}

export interface PlanningAccuracyStats {
  tasks_analyzed: number;
  avg_variance_minutes?: number | null;
  avg_underestimate_minutes?: number | null;
  avg_overestimate_minutes?: number | null;
  planned_minutes?: number | null;
  actual_minutes?: number | null;
  planning_vs_execution_gap_minutes?: number | null;
}

export interface PlanningBehaviorStats {
  rescheduled_tasks_count: number;
  missed_tasks_count: number;
  skipped_tasks_count: number;
  repeat_rescheduled_count: number;
  avg_reschedules_per_task: number;
}

export interface AnalyticsSummaryResponse {
  reference_date: string;
  completion_rates: CompletionRateStats;
  priority_distribution: PriorityDistribution;
  workload_vs_capacity: WorkloadVsCapacityStats;
  planning_accuracy?: PlanningAccuracyStats;
  planning_behavior?: PlanningBehaviorStats;
  habit_consistency?: HabitConsistencyStats;
  goal_progress?: GoalProgressSummary;
  insights: ProductivityInsight[];
}

const API_BASE_URL = 'http://localhost:8000/api/v1/analytics';

export const fetchAnalyticsSummary = async (referenceDate?: string): Promise<AnalyticsSummaryResponse> => {
  const url = referenceDate
    ? `${API_BASE_URL}/summary?reference_date=${encodeURIComponent(referenceDate)}`
    : `${API_BASE_URL}/summary`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: HTTP ${res.status}`);
  }
  return res.json();
};
