export type GoalStatus = 'active' | 'completed' | 'archived';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface GoalMilestone {
  id: number;
  goal_id: number;
  title: string;
  completed: boolean;
  status?: MilestoneStatus;
  due_date?: string | null; // YYYY-MM-DD
  order_index: number;
  created_at: string;
}

export interface GoalTaskShort {
  id: number;
  title: string;
  priority: string;
  completed: boolean;
  due_date?: string | null;
}

export interface Goal {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  target_date?: string | null; // YYYY-MM-DD
  status: GoalStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface GoalDetail extends Goal {
  milestones: GoalMilestone[];
  tasks: GoalTaskShort[];
}

export interface GoalMilestoneCreatePayload {
  title: string;
  status?: MilestoneStatus;
  due_date?: string | null;
  order_index?: number;
}

export interface GoalMilestoneUpdatePayload {
  title?: string;
  completed?: boolean;
  status?: MilestoneStatus;
  due_date?: string | null;
  order_index?: number;
}

export interface GoalCreatePayload {
  title: string;
  description?: string | null;
  category?: string;
  target_date?: string | null;
  status?: GoalStatus;
  milestones?: GoalMilestoneCreatePayload[];
}

export interface GoalUpdatePayload {
  title?: string;
  description?: string | null;
  category?: string;
  target_date?: string | null;
  status?: GoalStatus;
}
