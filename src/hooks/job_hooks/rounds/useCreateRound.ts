import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/axiosConfig';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export const useCreateRound = (jobId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/round/bulk-create-round-configs', {
        job_id: jobId,
        rounds: [data],
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Round created successfully');
      queryClient.invalidateQueries({
        queryKey: queryKeys.roundOverviews(jobId),
      });
    },
    onError: (err: any) => {
      console.error('Failed to create round', err);
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      toast.error(detail ? String(detail) : 'Failed to create round');
    },
  });
};
