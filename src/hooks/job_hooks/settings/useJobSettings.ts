import { useQuery } from '@tanstack/react-query'
import { getJobSettings } from '@/services/jobSettingService'
import { queryKeys } from '@/lib/queryKeys'

export const useJobSettings = (jobId?: string) => {
  return useQuery({
    queryKey: jobId ? queryKeys.jobSettings(jobId) : [],
    queryFn: () => getJobSettings(jobId!),
    enabled: !!jobId, // important
  })
}