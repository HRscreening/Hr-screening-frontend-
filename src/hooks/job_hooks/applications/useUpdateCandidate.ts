import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCandidate, attachCandidate } from '@/services/applicationService'
import { useJobId } from '@/store/jobPageStore'
import type { ApplicationsResponse } from '@/types/applicationTypes'

type UpdateCandidateVars = {
  applicationId: string
  candidateId: string | null
  full_name: string
  email: string
  phone?: string
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  const jobId = useJobId()
  const filter = { queryKey: ['applications', jobId] }

  return useMutation({
    mutationFn: ({ applicationId, candidateId, full_name, email, phone }: UpdateCandidateVars) => {
      if (!candidateId) {
        return attachCandidate(applicationId, { full_name, email, phone })
      }
      return updateCandidate(candidateId, { full_name, email, phone })
    },

    onSuccess: (_data, { applicationId, full_name, email, phone }) => {
      // Manually update any query that starts with ['applications']
      // This includes ['applications', jobId] and any paginated variants.
      queryClient.setQueriesData<ApplicationsResponse>({ queryKey: ['applications'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          applications: old.applications.map((a) =>
            a.id === applicationId
              ? {
                  ...a,
                  candidate: {
                    ...a.candidate,
                    full_name: full_name ?? a.candidate.full_name,
                    email: email ?? a.candidate.email,
                    phone: phone ?? a.candidate.phone,
                  },
                }
              : a
          ),
        }
      })
    },
  })
}
