import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProductForm } from '../components/products/ProductForm'
import * as sellerService from '../services/sellerService'
import type { ProductInput } from '../types'
import { renderWithProviders } from './testUtils'

vi.mock('../services/sellerService')

type SubmitFn = (input: ProductInput) => Promise<void>

describe('ProductForm', () => {
  beforeEach(() => {
    vi.mocked(sellerService.listSellers).mockResolvedValue({ items: [], total: 0, page: 1, page_size: 100 })
  })

  it('requires a product name', async () => {
    const onSubmit = vi.fn<SubmitFn>()
    renderWithProviders(<ProductForm submitLabel="Save" onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Product name is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a negative price', async () => {
    const onSubmit = vi.fn<SubmitFn>()
    renderWithProviders(<ProductForm submitLabel="Save" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/product name/i), 'Lamp')
    await userEvent.type(screen.getByLabelText(/^price/i), '-5')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Enter a valid, finite, non-negative price')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a non-numeric price', async () => {
    const onSubmit = vi.fn<SubmitFn>()
    renderWithProviders(<ProductForm submitLabel="Save" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/product name/i), 'Lamp')
    await userEvent.type(screen.getByLabelText(/^price/i), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Enter a valid, finite, non-negative price')).toBeInTheDocument()
  })

  it('rejects an infinite price', async () => {
    const onSubmit = vi.fn<SubmitFn>()
    renderWithProviders(<ProductForm submitLabel="Save" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/product name/i), 'Lamp')
    await userEvent.type(screen.getByLabelText(/^price/i), 'Infinity')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Enter a valid, finite, non-negative price')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a trimmed payload', async () => {
    const onSubmit = vi.fn<SubmitFn>().mockResolvedValue(undefined)
    renderWithProviders(<ProductForm submitLabel="Save" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/product name/i), '  Lamp  ')
    await userEvent.type(screen.getByLabelText(/^price/i), '12.5')
    await userEvent.type(screen.getByLabelText(/brand/i), ' Acme ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const input = onSubmit.mock.calls[0]?.[0]
    expect(input).toMatchObject({ name: 'Lamp', price: 12.5, brand: 'Acme', category: null, seller_profile_id: null })
  })

  it('shows the save error', async () => {
    const onSubmit = vi.fn<SubmitFn>().mockRejectedValue(new Error('Boom'))
    renderWithProviders(<ProductForm submitLabel="Save" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/product name/i), 'Lamp')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom')
  })
})
