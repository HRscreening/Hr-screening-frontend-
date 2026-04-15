import axios from '@/axiosConfig'

export const getInterviewSettings = async (jobId: string) => {
  const res = await axios.get(`/jobs/settings/${jobId}`)
  return res.data
}

// export const updateJobSettings = async ({
//   jobId,
//   data,
// }: {
//   jobId: string
//   data: any
// }) => { 
//   //! API not available yet
//   return axios.patch(`/jobs/${jobId}/Update-details`, data)
// }

// export const closeJobApplication = async (jobId: string) => {
//   return axios.post(`/jobs/${jobId}/close`)
// }