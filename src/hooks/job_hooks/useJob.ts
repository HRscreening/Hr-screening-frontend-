import { useQuery } from '@tanstack/react-query'
import { getJob, getRubricVersions, getPublicLink } from '@/services/jobService'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'


export const useJob = (jobId: string) => {
    const { user } = useAuthStore()
    return useQuery({
        queryKey: queryKeys.job(jobId!, user?.id || ""),
        queryFn: () => getJob(jobId!),
        enabled: !!jobId && !!user?.id,
        staleTime: 1000 * 60, // 1 min
    })
}


export const useJobRubric = (jobId: string) => {
    return useQuery({
        queryKey: queryKeys.rubrics(jobId!),
        queryFn: () => getRubricVersions(jobId!),
        enabled: !!jobId,
    })
}

export const usePublicLink = (jobId: string) => {
     return useQuery({
        queryKey: queryKeys.publicLink(jobId!),
        queryFn: () => getPublicLink(jobId!),
        enabled: !!jobId,
    })
}
