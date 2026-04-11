import axios from '@/axiosConfig'

export const getJobs = async () => {
  const res = await axios.get('/jobs/get-jobs')
  return res.data.jobs
}

export const deleteJob = async (jobId: string) => {
  return axios.delete(`/jobs/${jobId}`)
}


export const getJob = async (jobId: string) => {
  const res = await axios.get(`/jobs/get-job/${jobId}`)
  return res.data
}

export const getRubricVersions = async (jobId: string) => {
  const res = await axios.get(`/jobs/${jobId}/rubrics/versions`)
  return res.data
}

export const getPublicLink = async (jobId: string) => {
  const res = await axios.get(`/jobs/${jobId}/public-link`)
  return res.data
}