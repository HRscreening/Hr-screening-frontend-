import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/axiosConfig';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export const useDeleteRound = (jobId: string, roundConfigId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await axios.delete(`/round/delete-round-config/${roundConfigId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Round deleted');
      queryClient.invalidateQueries({
        queryKey: queryKeys.roundOverviews(jobId),
      });
    },
    onError: (err: any) => {
      console.error('Failed to delete round', err);
      toast.error('Failed to delete round');
    },
  });
};
