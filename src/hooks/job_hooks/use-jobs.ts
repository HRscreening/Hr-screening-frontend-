import { useQuery } from '@tanstack/react-query'
import { getJobs } from '@/services/jobService'
import { queryKeys } from '@/lib/queryKeys'

export const useJobs = () => {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: getJobs,
    select: (data) =>
      data.map((job: any) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        location: job.location ?? "",
        created_at: job.created_at,
        jd_url: job.jd_url,
        head_count: job.target_headcount
      })),
    staleTime: 1000 * 60 * 5, // 5 min

  })
}

