import { useQuery } from '@tanstack/react-query'
import { getAssessment } from '@/services/applicationService'
import { queryKeys } from '@/lib/queryKeys'
import type { InterviewAssessment } from '@/types/interviewAssessmentType'

export const useApplicationAssessment = (interviewId: string, enabled = false) => {
  return useQuery<InterviewAssessment>({
    queryKey: queryKeys.applicationAssessment(interviewId),
    queryFn: () => getAssessment(interviewId),
    enabled: !!interviewId && enabled,
    staleTime: 5 * 60 * 1000,
  })
}
