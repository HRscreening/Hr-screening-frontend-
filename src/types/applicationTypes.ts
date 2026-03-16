export interface Candidate {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  current_title: string | null;
  current_company: string | null;
}

// export interface Resume {
//   id: string;
//   raw_file_url: string;
//   status: 'parsed' | 'pending' | 'failed';
//   page_count: number;
//   uploaded_at: string;
// }

export type ApplicationStatus = 
  | 'applied' 
  | 'interview_scheduled' 
  | 'offer_extended' 
  | 'rejected'
  | 'drop_off' 
  | 'hired';

// export interface AIAnalysis {
//   good_points: string[];
//   bad_points: string[];
// }

// export interface GroundingData {
//   [key: string]: string[] | Record<string, string[]>;
// }

export interface Score {
  is_active: boolean;
  overall_score: number;
  ai_confidence: number;
  created_at: string;
  grounding_data: GroundingData;
  breakdown: Breakdown;
  is_overridden: boolean;
  version: number;
  is_latest: boolean;
}

export type statusType = 'applied' | 'shortlisted' | 'offer_extended' | 'rejected' | 'hired' | `round_${number}` | 'drop_off';

export interface Application {
  id: string;
  current_round: number;
  is_starred: boolean;
  denormalized_rank: number | null;
  is_flagged: boolean;
  offer_letter_url: string | null;
  flag_reason: string | null;
  tags: string[] | null;
  last_activity_at: string | null;
  deleted_at: string | null;
  status: statusType;
  created_at: string;
  updated_at: string;
  ai_analysis: AIAnalysis;
  candidate: Candidate;
  resume: Resume;
  scores: Score[];  // backend always returns an array
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination: Pagination;
}


// Updated types to match backend structure exactly

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


export interface AIAnalysis {
  [key: string]: string[]; // Matches Optional[Dict[str, List[str]]]
}

// Sub-criterion score (from score_post_processor output)
export type SubCriterionScore = {
  score: number;         // 0–100
  reasoning?: string | null;
};

// Criterion score (from score_post_processor output)
export type CriterionScore = {
  score: number;
  raw_llm_score?: number;
  reasoning?: string | null;
  requirement_level?: 'must' | 'should' | 'nice';
  sub_criteria?: Record<string, SubCriterionScore>;
};

// Section score (one entry per rubric section)
export type SectionScore = {
  score: number;         // weighted section score (0–100)
  raw_score?: number;    // unweighted section score
  criteria_scores: Record<string, CriterionScore>;
};

// Breakdown — keyed by rubric section key (e.g. "technical_skills", "experience")
export type Breakdown = Record<string, SectionScore>;

// Grounding data per criterion — evidence from the resume
export type GroundingCriterion = {
  jd_requirement?: string;
  evidence?: string[];
  match_assessment?: 'exceeds' | 'strong' | 'partial' | 'weak' | 'none';
};

// Grounding data — keyed by section key → criterion name
export type GroundingData = Record<string, Record<string, GroundingCriterion>>;


export interface Resume {
  id: string;
  raw_file_url: string;
  status: 'parsed' | 'pending' | 'failed' | 'scored'; // Added 'scored' status
  page_count: number;
  uploaded_at: string;
}