

export interface User {
  id: string;
  name: string;
  email: string;
}


export const JOB_STATUS = {
  DRAFT: "draft",
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

export type SubCriterionV2 = {
  name: string;
  display_name: string;
  weight: number;
  importance?: number;
  value?: string | null;
  value_type?: "none";
};

export type CriterionV2 = {
  name: string;
  display_name: string;
  weight: number;
  importance?: number;
  priority: number;
  value?: string | null;
  value_type?: "none";
  sub_criteria?: SubCriterionV2[] | null;
};

export type RubricSectionV2 = {
  key: string;
  label: string;
  criteria: CriterionV2[];
};

export type RubricCriteriaJsonbV2 = {
  schema_version: 2;
  sections: RubricSectionV2[];
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

/** Gate item from Step 2 gate derivation (backend rrg_final.requirements.gates_final) */
export type GateFinal = {
  canonical: string;
  raw: string;
  evidence_span?: string | null;
  policy_reason: string;
  confidence: number;
  needs_review: boolean;
};

/** Backend RRG final shape (after normalization + gate derivation) */
export type RRGRequirements = {
  must_have: Array<{
    raw: string;
    canonical: string;
    category: string;
    evidence_span?: string | null;
    extraction_confidence: number;
    interpretation_confidence: number;
  }>;
  nice_to_have: Array<{
    raw: string;
    canonical: string;
    category: string;
    evidence_span?: string | null;
    extraction_confidence: number;
    interpretation_confidence: number;
  }>;
  gate_candidates?: unknown[];
  gates_final?: GateFinal[];
  needs_review_count?: number;
};

export type RRGFinal = {
  metadata: {
    role_family?: { value: string; confidence: number; evidence_span?: string | null };
    seniority?: { value: string; confidence: number; evidence_span?: string | null };
    role_type?: string;
    role_type_confidence?: number;
    years_experience_candidates?: Array<{ value: string; confidence: number; evidence_span?: string | null }>;
    education_requirements?: unknown[];
    needs_clarification?: boolean;
  };
  requirements: RRGRequirements;
  context: {
    responsibilities?: Array<{ text: string; evidence_span?: string | null }>;
    constraints?: Array<{ type: string; value: string; evidence_span?: string | null }>;
    outcomes_metrics?: Array<{ metric: string; evidence_span?: string | null }>;
  };
};

export type ExtractedJD = {
  domain: string;
  domain_confidence: number;
  job_data: JobData;
  threshold_score: number;
  raw_jd_text?: string | null;
  sections: RubricSectionV2[];
  /** From rrg_final when backend returns new pipeline response */
  gates_final?: GateFinal[];
  needs_review_count?: number;
  needs_clarification?: boolean;
  /** Raw RRG for displaying full parsed JD viewer */
  _rrg?: RRGFinal;
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