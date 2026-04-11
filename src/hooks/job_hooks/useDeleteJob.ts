import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteJob } from '@/services/jobService'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'

export const useDeleteJob = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteJob,

    onSuccess: () => {
      toast.success("Job deleted successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
    },

    onError: () => {
      toast.error("Failed to delete job")
    }
  })
}