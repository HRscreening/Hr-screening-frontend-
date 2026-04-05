export interface CriteriaRating {
    rating: number;
    comment?: string | null;
    criteria: string;
}

export interface AiAssessment {
    justification: string | null;
    criteria_ratings: CriteriaRating[];
    final_recommendation: string | null;
}

export interface PanelistAssessment {
    final_verdict: string | null;
    response: {
        criteria_ratings: CriteriaRating[];
    } | null;
    submitted_at: string | null;
}

export interface InterviewAssessment {
    ai_assessment: AiAssessment | null;
    panelist_assessment: PanelistAssessment | null;
}
