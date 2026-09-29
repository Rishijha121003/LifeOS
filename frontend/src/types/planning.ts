import type { PriorityLevel } from './task';

export interface TaskRecommendation {
  id: number;
  title: string;
  priority: PriorityLevel;
  estimated_duration_minutes: number;
  due_time?: string | null;
  reason: string;
  score: number;
}

export interface ReplanSuggestion {
  current_time: string;
  day_end_time: string;
  available_minutes: number;
  summary: string;
  do_now: TaskRecommendation[];
  move_to_tomorrow: TaskRecommendation[];
}

export interface ApplyPlanRequest {
  reschedule_task_ids: number[];
  target_date: string;
}

export interface ApplyPlanResponse {
  status: string;
  updated_count: number;
}

// ==================== Routine Planner Types ====================

export interface FixedCommitment {
  id?: string;
  title: string;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
}

export interface ProposedTimelineItem {
  id: string;
  item_type: 'task' | 'commitment' | 'break';
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  task_id?: number | null;
  priority?: PriorityLevel | null;
  goal_title?: string | null;
  milestone_title?: string | null;
  deadline?: string | null;
  is_deadline_risk?: boolean;
}

export interface UnscheduledTaskItem {
  task_id: number;
  title: string;
  estimated_duration_minutes: number;
  priority: PriorityLevel;
  deadline?: string | null;
  reason: string;
  is_deadline_risk: boolean;
}

export interface RoutinePlanProposalRequest {
  date: string; // YYYY-MM-DD
  day_start_time: string;
  day_end_time: string;
  fixed_commitments: FixedCommitment[];
  selected_task_ids: number[];
}

export interface RoutinePlanProposalResponse {
  date: string;
  day_start_time: string;
  day_end_time: string;
  total_day_minutes: number;
  commitments_minutes: number;
  breaks_minutes: number;
  available_capacity_minutes: number;
  selected_workload_minutes: number;
  scheduled_workload_minutes: number;
  unscheduled_workload_minutes: number;
  is_overloaded: boolean;
  overload_minutes: number;
  capacity_status: 'enough' | 'tight' | 'overloaded';
  summary: string;
  timeline: ProposedTimelineItem[];
  unscheduled_tasks: UnscheduledTaskItem[];
}

export interface UnscheduledDispositionItem {
  task_id: number;
  action: 'move_tomorrow' | 'move_date' | 'backlog' | 'overtime' | 'keep_as_is';
  target_date?: string | null;
  target_time?: string | null;
}

export interface AcceptRoutinePlanItem {
  task_id: number;
  due_date: string;
  due_time: string; // HH:MM
}

export interface AcceptRoutinePlanRequest {
  plan_items: AcceptRoutinePlanItem[];
  unscheduled_dispositions?: UnscheduledDispositionItem[];
}

export interface AcceptRoutinePlanResponse {
  status: string;
  updated_count: number;
  message: string;
}

export interface RoutineSettingsResponse {
  day_start_time: string;
  day_end_time: string;
}


