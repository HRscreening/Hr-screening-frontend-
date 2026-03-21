import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ScoreAllButton from '@/components/jobs/jobPage/buttons/scoreAllButton'
import axios from '@/axiosConfig'

vi.mock('@/axiosConfig', () => ({
  default: { post: vi.fn() },
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockPost = axios.post as ReturnType<typeof vi.fn>

describe('ScoreAllButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the button', () => {
    render(<ScoreAllButton jobId="job-1" />)
    expect(screen.getByRole('button', { name: /score & rank/i })).toBeInTheDocument()
  })

  it('calls POST /jobs/{jobId}/score-all on click', async () => {
    mockPost.mockResolvedValueOnce({
      data: { enqueued_count: 5, batch_ids: ['b1'], message: 'Scoring enqueued for 5 resume(s)' },
    })

    render(<ScoreAllButton jobId="job-1" />)
    fireEvent.click(screen.getByRole('button', { name: /score & rank/i }))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/jobs/job-1/score-all')
    })
  })

  it('shows loading state while request is in flight', async () => {
    let resolve: (v: unknown) => void
    mockPost.mockReturnValueOnce(new Promise(r => { resolve = r }))

    render(<ScoreAllButton jobId="job-1" />)
    fireEvent.click(screen.getByRole('button', { name: /score & rank/i }))

    expect(screen.getByRole('button')).toBeDisabled()
    resolve!({ data: { enqueued_count: 0, batch_ids: [], message: '' } })
  })

  it('calls onSuccess callback after successful request', async () => {
    mockPost.mockResolvedValueOnce({
      data: { enqueued_count: 3, batch_ids: ['b1'], message: 'ok' },
    })
    const onSuccess = vi.fn()

    render(<ScoreAllButton jobId="job-1" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /score & rank/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('does not call onSuccess when request fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'))
    const onSuccess = vi.fn()

    render(<ScoreAllButton jobId="job-1" onSuccess={onSuccess} />)
    fireEvent.click(screen.getByRole('button', { name: /score & rank/i }))

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
