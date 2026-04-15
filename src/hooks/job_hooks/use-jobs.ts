import { useQuery } from '@tanstack/react-query'
import { getJobs } from '@/services/jobService'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'

export const useJobs = () => {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: queryKeys.jobs(user?.id || ""),
    queryFn: getJobs,
    enabled: !!user?.id,
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

