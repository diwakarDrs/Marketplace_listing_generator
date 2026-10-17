import type { ReactElement } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextType } from '../context/authContextValue'
import { system } from '../theme'
import type { User } from '../types'

export const testUser: User = {
  id: 1,
  email: 'a@example.com',
  full_name: 'Test User',
  is_active: true,
  is_verified: false,
  oauth_provider: null,
  created_at: '2026-01-01T00:00:00Z',
}

export function makeAuth(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: null,
    isLoading: false,
    login: async () => undefined,
    register: async () => undefined,
    setTokens: async () => undefined,
    logout: () => undefined,
    ...overrides,
  }
}

interface Options {
  auth?: AuthContextType
  route?: string
}

export function renderWithProviders(ui: ReactElement, { auth, route = '/' }: Options = {}): RenderResult {
  return render(
    <ChakraProvider value={system}>
      <AuthContext.Provider value={auth ?? makeAuth()}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </ChakraProvider>,
  )
}
