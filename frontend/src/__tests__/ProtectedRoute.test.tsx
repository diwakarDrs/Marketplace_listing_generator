import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { makeAuth, renderWithProviders, testUser } from './testUtils'

function Tree() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Secret dashboard</div>} />
      </Route>
    </Routes>
  )
}

describe('ProtectedRoute', () => {
  it('redirects anonymous users to /login', () => {
    renderWithProviders(<Tree />, { route: '/dashboard', auth: makeAuth({ user: null }) })
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })

  it('renders the outlet for authenticated users', () => {
    renderWithProviders(<Tree />, { route: '/dashboard', auth: makeAuth({ user: testUser }) })
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument()
  })

  it('shows neither page while loading', () => {
    renderWithProviders(<Tree />, { route: '/dashboard', auth: makeAuth({ isLoading: true }) })
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument()
  })
})
