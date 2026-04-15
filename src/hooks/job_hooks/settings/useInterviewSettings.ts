import { useQuery } from '@tanstack/react-query'
import { getInterviewSettings } from '@/services/interviewSettingsService'
import { queryKeys } from '@/lib/queryKeys'

export const useInterviewSettings = (jobId?: string) => {
  return useQuery({
    queryKey: jobId ? queryKeys.interviewSettings(jobId) : [],
    queryFn: () => getInterviewSettings(jobId!),
    enabled: !!jobId, // important
  })
}