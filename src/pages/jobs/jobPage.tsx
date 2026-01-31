import React from 'react'
import { useParams } from 'react-router-dom';


const JobPage = () => {
    const { jobId } = useParams<{ jobId: string }>()

  return (
    <div>
      You are viewing job with ID: {jobId}
    </div>
  )
}

export default JobPage
