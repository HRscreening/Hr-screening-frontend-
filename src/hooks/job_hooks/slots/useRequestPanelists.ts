import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestPanelists,requestAllPanelists } from '@/services/interviewSlotsService'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'

export const useRequestPanelists = (roundId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (panelistIds: string[]) =>
      requestPanelists({ roundId, panelistIds }),

    onSuccess: () => {
      toast.success("Request sent successfully.")
      queryClient.invalidateQueries({
        queryKey: queryKeys.roundSlots(roundId),
      })
    },

    onError: () => {
      toast.error("Failed to send request")
    },
  })
}



export const useRequestAllPanelists = (roundId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => requestAllPanelists(roundId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.roundSlots(roundId),
      })
    },
  })
}