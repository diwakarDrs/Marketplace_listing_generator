import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UsageMeter } from '../components/dashboard/UsageMeter'
import { renderWithProviders } from './testUtils'

describe('UsageMeter', () => {
  it('shows used / limit and period', () => {
    renderWithProviders(<UsageMeter usage={{ period: '2026-10', generations_used: 5, generations_limit: 20 }} />)
    expect(screen.getByText('5 of 20 generations used (2026-10)')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('caps at 100% when over the limit', () => {
    renderWithProviders(<UsageMeter usage={{ period: '2026-10', generations_used: 30, generations_limit: 20 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('does not divide by zero', () => {
    renderWithProviders(<UsageMeter usage={{ period: '2026-10', generations_used: 0, generations_limit: 0 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows a skeleton while loading', () => {
    renderWithProviders(<UsageMeter usage={null} isLoading />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('Monthly usage')).toBeInTheDocument()
  })
})
