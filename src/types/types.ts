

export interface User {
  id: string;
  name: string;
  email: string;
}


export const JOB_STATUS = {
  OPEN: "open",
  PAUSED: "paused",
  CLOSED: "closed",
  ARCHIVED: "archived",
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];


export type JobCardType = {
  id: string;
  title: string;
  status: JobStatus
  location: string;
  created_at: string;
  jd_url: string;
  head_count: number;
}

type SubCriterion = {
  weight: number;
  value?: string | null;  
}


export type Criterion = {
  weight: number;
  value?: string | null;
  sub_criteria?: Readonly<Record<string, SubCriterion>> | null;
};

export type JobData = {
  title: string;
  description: string;
  location?: string | null;
  salary?: string | null;
  target_headcount: number;
  metadata?: Readonly<Record<string, unknown>> | null;
  voice_ai_enabled?: boolean;
  is_confidential?: boolean;
  manual_rounds_count?: number;

};

export type ExtractedJD = {
  job_data: JobData;
  threshold_score: number;
  criteria: {
    mandatory_criteria: Record<string, Criterion>;
    screening_criteria: Record<string, Criterion>;
  };
}


// Updated types to match backend structure exactly

export interface AIAnalysis {
  [key: string]: string[]; // Matches Optional[Dict[str, List[str]]]
}

export interface GroundingData {
  [key: string]: any; // Matches Dict[str, Any] - completely flexible
}

export interface Score {
  is_active: boolean;
  overall_score: number;
  ai_confidence: number;
  created_at: string;
  grounding_data: GroundingData;
  is_overridden: boolean;
  version: number;
  is_latest: boolean;
}

export interface Resume {
  id: string;
  raw_file_url: string;
  status: 'parsed' | 'pending' | 'failed';
  page_count: number;
  uploaded_at: string;
}