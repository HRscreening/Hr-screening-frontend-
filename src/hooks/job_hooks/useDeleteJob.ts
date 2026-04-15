import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteJob } from '@/services/jobService'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: deleteJob,

    onSuccess: () => {
      toast.success("Job deleted successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs(user?.id || '') })
    },

    onError: () => {
      toast.error("Failed to delete job")
    }
  })
}