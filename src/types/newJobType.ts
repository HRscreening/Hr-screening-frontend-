export type JobStatus = "open" | "paused" | "closed" | "archived";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "rejected"
  | "hired"
  | "withdrawn";

export interface JobOverviewInfo {
  id: string;
  title: string;
  status: JobStatus;
  description: string;
  created_at: string;
  salary: number | null;
  location: string | null;
  target_headcount: number | null;
  current_batch_id: string | null;
}

export interface DashboardInfo {
  total_applications: number;
  by_status: Partial<Record<ApplicationStatus, number>>;
  avg_score: number;
}

export interface RubricVersionInfo {
  id: string;
  version: string;
  created_at: string;
}

export interface CriteriaOverview {
  current_active_version: string ;
  active_rubric_id: string ;
  versions: RubricVersionInfo[];
}

export interface JobOverviewResponse {
  job: JobOverviewInfo;
  dashboard: DashboardInfo;
  criteria: CriteriaOverview;
}
