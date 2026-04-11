import axios from '@/axiosConfig'

export const getInterviewDetails = async (applicationId: string) => {
  const res = await axios.get(`/interview/get-interview-details/${applicationId}`)
  return res.data
}

export const getAssessment = async (interviewId: string) => {
  const res = await axios.get(`/assessment/get-assessment/${interviewId}`)
  return res.data
}

export const getApplications = async ({
  jobId,
  page,
  pageSize,
}: {
  jobId: string
  page: number
  pageSize: number
}) => {
  const res = await axios.get(`jobs/get-applications/${jobId}`, {
    params: {
      page,
      page_size: pageSize,
    },
  })

  return res.data
}

export const starApplication = async (applicationId: string) => {
  const res = await axios.patch(`/application/star/${applicationId}`)
  return res.data
}

export const unstarApplication = async (applicationId: string) => {
  const res = await axios.patch(`/application/unstar/${applicationId}`)
  return res.data
}

export const flagApplication = async (applicationId: string, reason: string) => {
  const res = await axios.patch(`/application/flag/${applicationId}`, { flag_reason: reason })
  return res.data
}

export const unflagApplication = async (applicationId: string) => {
  const res = await axios.patch(`/application/unflag/${applicationId}`)
  return res.data
}

export const deleteApplication = async (applicationId: string) => {
  const res = await axios.delete(`/application/delete/${applicationId}`)
  return res.data
}

export const updateCandidate = async (
  candidateId: string,
  data: { full_name?: string; email?: string; phone?: string }
) => {
  const res = await axios.patch(`/candidate/edit/${candidateId}`, data)
  return res.data
}

export const attachCandidate = async (
  applicationId: string,
  data: { full_name: string; email: string; phone?: string }
) => {
  const res = await axios.post(`/application/attach-candidate/${applicationId}`, data)
  return res.data
}

export const changeApplicationStatus = async (applicationId: string, newStatus: string) => {
  const res = await axios.patch(`/application/change-status/${applicationId}`, { new_status: newStatus })
  return res.data
}

export const moveApplicationToRound = async (
  applicationId: string,
  jobId: string,
  targetRound: number
) => {
  const res = await axios.post(`/application/move-to-round/${applicationId}`, {
    job_id: jobId,
    target_round: targetRound,
  })
  return res.data
}