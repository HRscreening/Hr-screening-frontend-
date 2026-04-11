import { useQuery } from '@tanstack/react-query'
import { getJob, getRubricVersions, getPublicLink } from '@/services/jobService'
import { queryKeys } from '@/lib/queryKeys'


export const useJob = (jobId: string) => {
    return useQuery({
        queryKey: queryKeys.job(jobId!),
        queryFn: () => getJob(jobId!),
        enabled: !!jobId,
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
