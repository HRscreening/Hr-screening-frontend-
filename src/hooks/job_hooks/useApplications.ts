import { useQuery } from '@tanstack/react-query';
import { getApplications } from '@/services/applicationService';
import { queryKeys } from '@/lib/queryKeys';
import type { ApplicationsResponse } from '@/types/applicationTypes';

export const useApplications = (jobId: string | undefined, page: number, pageSize: number) => {
  return useQuery<ApplicationsResponse>({
    queryKey: queryKeys.applications(jobId ?? '', page, pageSize),
    queryFn: () => getApplications({ jobId: jobId ?? '', page, pageSize }),
    enabled: !!jobId,
    staleTime: 1000 * 45, // 45s — backend processes resumes and updates scores frequently
  });
};
