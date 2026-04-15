import { useQuery } from '@tanstack/react-query'
import { getJobSettings } from '@/services/jobSettingService'
import { queryKeys } from '@/lib/queryKeys'

export const useJobSettings = (jobId?: string) => {
  return useQuery({
    queryKey: jobId ? queryKeys.jobSettings(jobId) : [],
    queryFn: () => getJobSettings(jobId!),
    staleTime: 1000 * 60 * 30, // 30 min as settings don't change often unless updated by user
    enabled: !!jobId, // important
  })
}