import type { RubricCriteriaJsonbV2 } from "./types";

// enums should mirror backend enums
export type JobStatus = "draft" | "open" | "paused" | "closed" | "archived"; // Mirrors backend (includes draft)

export type ApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED"
  | "WITHDRAWN";

export type Job = {
  id: string;
  title: string;
  status: JobStatus; // This now matches backend lowercase
  target_headcount: number;
  created_at?: string; // Optional since backend may not always send it
  // Note: Backend doesn't send these fields in the response
  // description?: string;
  // salary?: string;
  // location?: string;
}

export type Dashboard = {
  total_applications: number;
  by_status: Partial<Record<ApplicationStatus, number>>; // This can be empty object {}
}

export type Criteria = {
  rubric_id: string;
  version: number;
  threshold_score: number;
  criteria: RubricCriteriaJsonbV2;
}

export type SettingsTypes = {
  voice_ai_enabled: boolean;
  manual_rounds_count: number;
  is_confidential: boolean;
  job_metadata: Record<string, any> | null;
  closing_reason: string | null;
}

export type JobOverviewResponse = {
  job: Job;
  dashboard: Dashboard;
  criteria: Criteria;
  settings: SettingsTypes;
};


export interface RubricVersionData{
  current_active_version: string;
  active_rubric_id: string;
  versions: {
    rubric_id: string;
    rubric_version: string;
    created_at: string;
    is_active?: boolean;
  }[]
}