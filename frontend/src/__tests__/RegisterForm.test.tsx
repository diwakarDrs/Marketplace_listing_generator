import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RegisterForm } from '../components/auth/RegisterForm'
import { makeAuth, renderWithProviders } from './testUtils'

type RegisterFn = (email: string, password: string, fullName: string) => Promise<void>

describe('RegisterForm', () => {
  it('rejects short passwords', async () => {
    const register = vi.fn<RegisterFn>()
    renderWithProviders(<RegisterForm />, { auth: makeAuth({ register }) })
    await userEvent.type(screen.getByLabelText(/^email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'short')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'short')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/fix the highlighted/i)
    expect(register).not.toHaveBeenCalled()
  })

  it('rejects mismatched confirmation', async () => {
    const register = vi.fn<RegisterFn>()
    renderWithProviders(<RegisterForm />, { auth: makeAuth({ register }) })
    await userEvent.type(screen.getByLabelText(/^email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password124')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('rejects an invalid email', async () => {
    const register = vi.fn<RegisterFn>()
    renderWithProviders(<RegisterForm />, { auth: makeAuth({ register }) })
    await userEvent.type(screen.getByLabelText(/^email/i), 'nope')
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('submits valid data', async () => {
    const register = vi.fn<RegisterFn>().mockResolvedValue(undefined)
    renderWithProviders(<RegisterForm />, { auth: makeAuth({ register }) })
    await userEvent.type(screen.getByLabelText(/full name/i), 'Ann')
    await userEvent.type(screen.getByLabelText(/^email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(register).toHaveBeenCalledWith('a@example.com', 'password123', 'Ann'))
  })
})
