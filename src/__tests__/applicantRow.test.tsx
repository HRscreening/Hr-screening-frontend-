import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ApplicationRow from '@/components/jobs/jobPage/application/applicantRow'
import type { Application } from '@/types/applicationTypes'

// Minimal mocks for heavy child components
vi.mock('@/components/jobs/jobPage/application/viewAnalysisSheet', () => ({
  default: () => null,
}))
vi.mock('@/components/jobs/jobPage/application/applicationMenuButton', () => ({
  default: () => null,
}))
vi.mock('@/components/jobs/jobPage/buttons/statusButton', () => ({
  Status: () => <span data-testid="status-badge">applied</span>,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const baseApplication: Application = {
  id: 'app-1',
  current_round: 0,
  is_starred: false,
  denormalized_rank: null,
  is_flagged: false,
  offer_letter_url: null,
  flag_reason: null,
  tags: null,
  last_activity_at: null,
  deleted_at: null,
  status: 'applied',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ai_analysis: {},
  scores: [],
  candidate: {
    id: 'cand-1',
    full_name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+91 9876543210',
    current_title: 'Software Engineer',
    current_company: 'Acme Corp',
  },
  resume: {
    id: 'res-1',
    raw_file_url: 'https://example.com/resume.pdf',
    status: 'parsed',
    page_count: 2,
    uploaded_at: '2024-01-01T00:00:00Z',
  },
}

function renderRow(app: Application = baseApplication) {
  return render(
    <table>
      <tbody>
        <ApplicationRow application={app} onViewDetails={vi.fn()} />
      </tbody>
    </table>
  )
}

describe('ApplicationRow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('displays candidate full name', () => {
    renderRow()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('displays candidate email', () => {
    renderRow()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('displays candidate phone number', () => {
    renderRow()
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument()
  })

  it('shows "No phone" when phone is null', () => {
    const app = {
      ...baseApplication,
      candidate: { ...baseApplication.candidate, phone: null },
    }
    renderRow(app)
    expect(screen.getByText('No phone')).toBeInTheDocument()
  })

  it('shows resume status badge when resume exists', () => {
    renderRow()
    expect(screen.getByTestId('resume-status-badge')).toBeInTheDocument()
    expect(screen.getByTestId('resume-status-badge')).toHaveTextContent('parsed')
  })

  it('shows resume status badge as "pending" when status is pending', () => {
    const app = {
      ...baseApplication,
      resume: { ...baseApplication.resume, status: 'pending' as const },
    }
    renderRow(app)
    expect(screen.getByTestId('resume-status-badge')).toHaveTextContent('pending')
  })

  it('renders a view resume link', () => {
    renderRow()
    const link = screen.getByRole('link', { name: /resume/i })
    expect(link).toHaveAttribute('href', 'https://example.com/resume.pdf')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows 0% match when no scores present', () => {
    renderRow()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows correct match percentage when score present', () => {
    const app = {
      ...baseApplication,
      scores: [{
        is_active: true, overall_score: 82, ai_confidence: 0.9,
        created_at: '', grounding_data: {}, breakdown: {},
        is_overridden: false, version: 1, is_latest: true,
      }],
    }
    renderRow(app)
    expect(screen.getByText('82%')).toBeInTheDocument()
  })
})
