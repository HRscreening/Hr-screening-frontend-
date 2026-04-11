import axios from '@/axiosConfig'

export const getRoundOverviews = async (jobId: string) => {
    const res = await axios.get(`/round/${jobId}/rounds/overview`)
    return res.data
}


