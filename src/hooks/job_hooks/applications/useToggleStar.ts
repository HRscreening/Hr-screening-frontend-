import { useMutation, useQueryClient } from '@tanstack/react-query'
import { starApplication, unstarApplication } from '@/services/applicationService'
import type { ApplicationsResponse } from '@/types/applicationTypes'
import { toast } from 'sonner'

export function useToggleStar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, isStarred }: { applicationId: string; isStarred: boolean }) =>
      isStarred ? unstarApplication(applicationId) : starApplication(applicationId),

    onSuccess: (_data, { applicationId, isStarred }) => {
      queryClient.setQueriesData<ApplicationsResponse>({ queryKey: ['applications'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          applications: old.applications.map((a) =>
            a.id === applicationId ? { ...a, is_starred: !isStarred } : a
          ),
        }
      })
      toast.success(isStarred ? 'Application unstarred' : 'Application starred')
    },

    onError: () => {
      toast.error('Failed to update star status.')
    },
  })
}
