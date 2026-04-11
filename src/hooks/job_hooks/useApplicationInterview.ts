import { useQuery } from '@tanstack/react-query'
import { getInterviewDetails } from '@/services/applicationService'
import { queryKeys } from '@/lib/queryKeys'
import type { InterviewTabData } from '@/components/jobs/jobPage/application/analysis_sheets/interviewAnalysisSheet'

export const useApplicationInterview = (applicationId: string, enabled = false) => {
  return useQuery<InterviewTabData>({
    queryKey: queryKeys.applicationInterview(applicationId),
    queryFn: () => getInterviewDetails(applicationId),
    enabled: !!applicationId && enabled,
    staleTime: 5 * 60 * 1000,
  })
}
