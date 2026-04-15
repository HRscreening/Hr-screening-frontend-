import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changeApplicationStatus, moveApplicationToRound } from '@/services/applicationService'
// import { useJobId } from '@/store/jobPageStore'
import type { ApplicationsResponse, statusType } from '@/types/applicationTypes'

function isRoundStatus(s: statusType) {
  return /^round_[0-9]+$/.test(String(s))
}

export function useChangeApplicationStatus() {
  const queryClient = useQueryClient()
  // const jobId = useJobId() ?? ''
  // const filter = { queryKey: ['applications', jobId] }

  return useMutation({
    mutationFn: ({ jobId,applicationId, newStatus }: {jobId:string, applicationId: string; newStatus: statusType }) => {
      if (isRoundStatus(newStatus)) {
        const targetRound = parseInt(String(newStatus).split('_')[1], 10)
        return moveApplicationToRound(applicationId, jobId, targetRound)
      }
      return changeApplicationStatus(applicationId, newStatus)
    },

    onSuccess: (data, { applicationId, newStatus }) => {
      const resolvedStatus: statusType =
        isRoundStatus(newStatus) && data.new_round
          ? (`round_${data.new_round}` as statusType)
          : newStatus

      queryClient.setQueriesData<ApplicationsResponse>({ queryKey: ['applications'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          applications: old.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  status: resolvedStatus,
                  current_round:
                    isRoundStatus(newStatus) && data.new_round
                      ? data.new_round
                      : a.current_round,
                }
              : a
          ),
        }
      })
    },
  })
}
