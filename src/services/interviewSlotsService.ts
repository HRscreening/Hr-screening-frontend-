import axios from '@/axiosConfig'

export const getRoundSlots = async (roundId: string) => {
  const res = await axios.get(`/round/${roundId}/slots`)
  return res.data
}

export const requestPanelists = async ({
  roundId,
  panelistIds,
}: {
  roundId: string
  panelistIds: string[]
}) => {
  return axios.post(`/round/request-panelists-for-slots/${roundId}`, {
    panelist_ids: panelistIds,
  })
}

export const requestAllPanelists = async (roundId: string) => {
  return axios.post(`/round/request-all-panelists-for-slots/${roundId}`)
}