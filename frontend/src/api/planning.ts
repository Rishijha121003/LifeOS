import type {
  ReplanSuggestion,
  ApplyPlanRequest,
  ApplyPlanResponse,
  RoutinePlanProposalRequest,
  RoutinePlanProposalResponse,
  AcceptRoutinePlanRequest,
  AcceptRoutinePlanResponse,
  RoutineSettingsResponse,
} from '../types/planning';

const API_BASE_URL = 'http://localhost:8000/api/v1/planning';

export const fetchPlanningSuggestion = async (
  targetEndTime?: string,
  currentTime?: string,
  currentDate?: string
): Promise<ReplanSuggestion> => {
  const params = new URLSearchParams();
  if (targetEndTime) params.append('target_end_time', targetEndTime);
  if (currentTime) params.append('current_time', currentTime);
  if (currentDate) params.append('current_date', currentDate);

  const url = `${API_BASE_URL}/suggest?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Failed to fetch planning suggestion`);
  }

  const data: ReplanSuggestion = await res.json();
  return data;
};

export const applyPlanningPlan = async (payload: ApplyPlanRequest): Promise<ApplyPlanResponse> => {
  const res = await fetch(`${API_BASE_URL}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${res.status}: Failed to apply replan recommendation`);
  }

  const data: ApplyPlanResponse = await res.json();
  return data;
};

// ==================== Routine Planner API Calls ====================

export const fetchRoutineSettings = async (): Promise<RoutineSettingsResponse> => {
  const res = await fetch(`${API_BASE_URL}/routine/settings`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    return { day_start_time: '07:00', day_end_time: '22:00' };
  }

  return res.json();
};

export const proposeRoutinePlan = async (
  payload: RoutinePlanProposalRequest
): Promise<RoutinePlanProposalResponse> => {
  const res = await fetch(`${API_BASE_URL}/routine/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detailMsg = Array.isArray(errorData.detail)
      ? errorData.detail.map((e: any) => e.msg).join(', ')
      : errorData.detail || `HTTP ${res.status}: Failed to build plan proposal`;
    throw new Error(detailMsg);
  }

  return res.json();
};

export const acceptRoutinePlan = async (
  payload: AcceptRoutinePlanRequest
): Promise<AcceptRoutinePlanResponse> => {
  const res = await fetch(`${API_BASE_URL}/routine/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detailMsg = Array.isArray(errorData.detail)
      ? errorData.detail.map((e: any) => e.msg).join(', ')
      : errorData.detail || `HTTP ${res.status}: Failed to accept routine plan`;
    throw new Error(detailMsg);
  }

  return res.json();
};

