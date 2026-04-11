import { useQuery } from '@tanstack/react-query';
import { getRoundOverviews } from '@/services/interviewRoundsService';
import { queryKeys } from '@/lib/queryKeys';
import type { RoundOverview } from '@/types/roundConfigTypes';

export const useRoundOverviews = (jobId: string | undefined) => {
  return useQuery<RoundOverview[]>({
    queryKey: queryKeys.roundOverviews(jobId ?? ''),
    queryFn: () => getRoundOverviews(jobId ?? ''),
    enabled: !!jobId,
  });
};
