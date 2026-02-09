import type { Criterion } from "./types";

// enums should mirror backend enums
export type JobStatus = "open" | "paused" | "closed" | "archived"; // Changed to lowercase to match backend

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
  criteria: {
    mandatory_criteria: Record<string, Criterion>;
    screening_criteria: Record<string, Criterion>;
  }
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