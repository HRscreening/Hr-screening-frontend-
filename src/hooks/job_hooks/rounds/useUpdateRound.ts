import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/axiosConfig';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export const useUpdateRound = (jobId: string, roundConfigId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
        console.log("data",data);
        
      const res = await axios.put(`/round/update-round-config/${roundConfigId}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Round updated successfully');
      queryClient.invalidateQueries({
        queryKey: queryKeys.roundOverviews(jobId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.roundConfig(roundConfigId),
      });
    },
    onError: (err: any) => {
      console.error('Failed to update round', err);
      toast.error('Failed to update round');
    },
  });
};
