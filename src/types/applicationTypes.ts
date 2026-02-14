export interface Candidate {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
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
  | 'in_review' 
  | 'interview_scheduled' 
  | 'offer_extended' 
  | 'rejected' 
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
  is_overridden: boolean;
  version: number;
  is_latest: boolean;
}

export type statusType = 'applied' | 'in_review' | 'shortlisted' | 'rejected' | 'offered';

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
  scores: Score[];
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

export interface GroundingData {
  [key: string]: any; // Matches Dict[str, Any] - completely flexible
}
export interface Resume {
  id: string;
  raw_file_url: string;
  status: 'parsed' | 'pending' | 'failed' | 'scored'; // Added 'scored' status
  page_count: number;
  uploaded_at: string;
}