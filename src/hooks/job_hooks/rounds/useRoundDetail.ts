import { useQuery } from '@tanstack/react-query';
import axios from '@/axiosConfig';
import { queryKeys } from '@/lib/queryKeys';
import type { RoundFullConfig } from '@/types/roundConfigEditTypes';

export const useRoundDetail = (roundConfigId: string) => {
  return useQuery({
    queryKey: queryKeys.roundConfig(roundConfigId),
    queryFn: async (): Promise<RoundFullConfig> => {
      const res = await axios.get(`/round/get-round-config/${roundConfigId}`);
      return res.data;
    },
    enabled: !!roundConfigId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
