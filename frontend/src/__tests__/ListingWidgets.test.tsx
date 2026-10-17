import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CharCounter } from '../components/listings/CharCounter'
import { CopyButton } from '../components/listings/CopyButton'
import { ValidationBadges } from '../components/listings/ValidationBadges'
import { buildListingText } from '../components/listings/clipboard'
import { renderWithProviders } from './testUtils'

const copyText = vi.fn<(t: string) => Promise<boolean>>()
vi.mock('../components/listings/clipboard', async () => {
  const actual = await vi.importActual<typeof import('../components/listings/clipboard')>(
    '../components/listings/clipboard',
  )
  return { ...actual, copyText: (t: string) => copyText(t) }
})

describe('CharCounter', () => {
  it('shows length / max', () => {
    renderWithProviders(<CharCounter value="hello" max={10} />)
    expect(screen.getByText('5 / 10')).toBeInTheDocument()
  })

  it('counts code points, not UTF-16 units', () => {
    renderWithProviders(<CharCounter value={'\u{1F600}\u{1F600}'} max={10} />)
    expect(screen.getByText('2 / 10')).toBeInTheDocument()
  })

  it('handles over-limit values', () => {
    renderWithProviders(<CharCounter value={'a'.repeat(12)} max={10} />)
    expect(screen.getByText('12 / 10')).toBeInTheDocument()
  })
})

describe('ValidationBadges', () => {
  it('shows success when there are no warnings', () => {
    renderWithProviders(<ValidationBadges warnings={[]} />)
    expect(screen.getByText('All checks passed')).toBeInTheDocument()
  })

  it('lists each warning', () => {
    renderWithProviders(
      <ValidationBadges
        warnings={[
          { field: 'title', message: 'Title is too long' },
          { field: 'bullets[2]', message: 'Bullet 2 is too long' },
        ]}
      />,
    )
    expect(screen.getByText(/Title is too long/)).toBeInTheDocument()
    expect(screen.getByText(/Bullet 2 is too long/)).toBeInTheDocument()
    expect(screen.queryByText('All checks passed')).not.toBeInTheDocument()
  })
})

describe('CopyButton', () => {
  beforeEach(() => copyText.mockReset())

  it('copies text and shows feedback', async () => {
    copyText.mockResolvedValue(true)
    renderWithProviders(<CopyButton text="hello" label="Copy title" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy title' }))
    expect(copyText).toHaveBeenCalledWith('hello')
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('does not show copied when the clipboard fails', async () => {
    copyText.mockResolvedValue(false)
    renderWithProviders(<CopyButton text="hello" label="Copy title" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy title' }))
    await waitFor(() => expect(copyText).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument()
  })

  it('is disabled with no text, icon variant has aria-label', () => {
    renderWithProviders(<CopyButton text="" />)
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
  })
})

describe('buildListingText', () => {
  it('formats a listing for the clipboard', () => {
    const text = buildListingText({ title: 'T', bullets: ['a', 'b'], description: 'D', keywords: ['x', 'y'] })
    expect(text).toBe('T\n\n- a\n- b\n\nD\n\nKeywords: x, y')
  })
})
