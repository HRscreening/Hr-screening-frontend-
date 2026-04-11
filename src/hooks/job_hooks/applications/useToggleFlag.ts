import { useMutation, useQueryClient } from '@tanstack/react-query'
import { flagApplication, unflagApplication } from '@/services/applicationService'
import { useJobId } from '@/store/jobPageStore'
import type { ApplicationsResponse } from '@/types/applicationTypes'
import { toast } from 'sonner'

export function useToggleFlag() {
  const queryClient = useQueryClient()
  const jobId = useJobId()
  const filter = { queryKey: ['applications', jobId] }

  return useMutation({
    mutationFn: ({
      applicationId,
      isFlagged,
      reason,
    }: {
      applicationId: string
      isFlagged: boolean
      reason?: string
    }) => (isFlagged ? unflagApplication(applicationId) : flagApplication(applicationId, reason!)),

    onSuccess: (_data, { applicationId, isFlagged, reason }) => {
      queryClient.setQueriesData<ApplicationsResponse>({ queryKey: ['applications'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          applications: old.applications.map((a) =>
            a.id === applicationId
              ? { ...a, is_flagged: !isFlagged, flag_reason: isFlagged ? null : (reason ?? null) }
              : a
          ),
        }
      })
      toast.success(isFlagged ? 'Application unflagged' : 'Application flagged')
    },

    onError: () => {
      toast.error('Failed to update flag status.')
    },
  })
}
