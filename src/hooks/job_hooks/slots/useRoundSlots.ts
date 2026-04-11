import { useQuery } from '@tanstack/react-query'
import { getRoundSlots } from '@/services/interviewSlotsService'
import { queryKeys } from '@/lib/queryKeys'

export const useRoundSlots = (roundId?: string) => {
  return useQuery({
    queryKey: roundId ? queryKeys.roundSlots(roundId) : [],
    queryFn: () => getRoundSlots(roundId!),
    enabled: !!roundId,
  })
}