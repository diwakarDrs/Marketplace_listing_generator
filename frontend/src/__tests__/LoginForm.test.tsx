import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from '../components/auth/LoginForm'
import { makeAuth, renderWithProviders } from './testUtils'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

type LoginFn = (email: string, password: string) => Promise<void>

function apiError(status: number, data: unknown): AxiosError {
  const response = { status, data, statusText: '', headers: {}, config: {} } as AxiosResponse
  return new AxiosError('fail', 'ERR', undefined, undefined, response)
}

describe('LoginForm', () => {
  it('shows an error and does not call login for invalid input', async () => {
    const login = vi.fn<LoginFn>()
    renderWithProviders(<LoginForm />, { auth: makeAuth({ login }) })
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i)
    expect(login).not.toHaveBeenCalled()
  })

  it('logs in and navigates to the dashboard', async () => {
    const login = vi.fn<LoginFn>().mockResolvedValue(undefined)
    renderWithProviders(<LoginForm />, { auth: makeAuth({ login }) })
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(login).toHaveBeenCalledWith('a@example.com', 'secret123'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('surfaces the backend error message', async () => {
    const login = vi
      .fn<LoginFn>()
      .mockRejectedValue(apiError(401, { error: { code: 'unauthorized', message: 'Incorrect email or password' } }))
    renderWithProviders(<LoginForm />, { auth: makeAuth({ login }) })
    await userEvent.type(screen.getByLabelText(/email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password')
  })

  it('shows an initial error', () => {
    renderWithProviders(<LoginForm initialError="Google sign-in failed" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Google sign-in failed')
  })
})
