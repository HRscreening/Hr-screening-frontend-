// lib/queryKeys.ts
export const queryKeys = {
  jobs: (userId: string) => ['jobs', userId],
  job: (id: string, userId: string) => ['job', id, userId],
  rubrics: (jobId: string) => ['rubrics', jobId],
  publicLink: (jobId: string) => ['public-link', jobId],
  jobSettings: (id: string) => ['job-settings', id],
  interviewSettings: (jobId: string) => ['interview-settings', jobId],
  roundOverviews: (jobId: string) => ['rounds', 'overview', jobId],
  roundConfig: (roundConfigId: string) => ['round', roundConfigId],
  roundSlots: (roundConfigId: string) => ['round-slots', roundConfigId],
  applications: (jobId: string, page: number, pageSize: number) => ['applications', jobId, page, pageSize],
  applicationScore: (id: string) => ['application-score', id],
  applicationInterview: (id: string) => ['application-interview', id],
  applicationAssessment: (interviewId: string) => ['application-assessment', interviewId],
}