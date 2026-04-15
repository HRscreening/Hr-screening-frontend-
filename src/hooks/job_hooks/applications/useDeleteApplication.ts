import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteApplication } from '@/services/applicationService'
import type { ApplicationsResponse } from '@/types/applicationTypes'
import { toast } from 'sonner'

export function useDeleteApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) =>
      deleteApplication(applicationId),

    onSuccess: (_data, { applicationId }) => {
      queryClient.setQueriesData<ApplicationsResponse>({ queryKey: ['applications'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          applications: old.applications.filter((a) => a.id !== applicationId),
          pagination: { ...old.pagination, total: old.pagination.total - 1 },
        }
      })
      toast.success('Application deleted')
    },

    onError: () => {
      toast.error('Failed to delete application.')
    },
  })
}
