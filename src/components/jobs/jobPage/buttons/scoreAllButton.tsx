import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import axios from '@/axiosConfig'

interface ScoreAllButtonProps {
  jobId: string
  onSuccess?: () => void
}

const ScoreAllButton: React.FC<ScoreAllButtonProps> = ({ jobId, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`/jobs/${jobId}/score-all`)
      const { enqueued_count } = res.data
      toast.success(`Scoring started for ${enqueued_count} resume${enqueued_count !== 1 ? 's' : ''}`)
      onSuccess?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to start scoring'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      Score & Rank All
    </Button>
  )
}

export default ScoreAllButton
