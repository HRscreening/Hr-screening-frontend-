import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateJobSettings } from '@/services/jobSettingService'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'

export const useUpdateJobSettings = (jobId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => updateJobSettings({ jobId, data }),

    onSuccess: () => {
      toast.success("Settings saved")
      queryClient.invalidateQueries({
        queryKey: [queryKeys.jobSettings(jobId),queryKeys.job(jobId),queryKeys.jobs],
      })
    },

    onError: () => {toast.error("Failed to save settings")},
  })
}