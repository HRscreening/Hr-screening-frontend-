import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { closeJobApplication } from '@/services/jobSettingService'
import { toast } from 'sonner'

export const useCloseJob = (jobId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => closeJobApplication(jobId),

    onSuccess: () => {
      toast.success("Applications closed")
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobSettings(jobId),
      })
    },

    onError: () => {
      toast.error("Failed to close application")
    },
  })
}