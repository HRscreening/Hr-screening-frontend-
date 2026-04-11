// lib/queryKeys.ts
export const queryKeys = {
  jobs: ['jobs'],
  job: (id: string) => ['job', id],
  rubrics: (jobId: string) => ['rubrics', jobId],
  publicLink: (jobId: string) => ['public-link', jobId],
  jobSettings: (id: string) => ['job-settings', id],
  roundOverviews: (jobId: string) => ['rounds', 'overview', jobId],
  roundConfig: (roundConfigId: string) => ['round', roundConfigId],
  roundSlots: (id: string) => ['round-slots', id],
  applications: (jobId: string, page: number, pageSize: number) => ['applications', jobId, page, pageSize],
  applicationScore: (id: string) => ['application-score', id],
  applicationInterview: (id: string) => ['application-interview', id],
  applicationAssessment: (interviewId: string) => ['application-assessment', interviewId],
}