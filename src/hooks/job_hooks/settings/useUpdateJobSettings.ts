import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateJobSettings } from '@/services/jobSettingService'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

export const useUpdateJobSettings = (jobId: string) => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: (data: any) => updateJobSettings({ jobId, data }),

    onSuccess: () => {
      toast.success("Settings saved")
      const userId = user?.id || ''
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobSettings(jobId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.job(jobId, userId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.jobs(userId),
      })
    },

    onError: () => {toast.error("Failed to save settings")},
  })
}