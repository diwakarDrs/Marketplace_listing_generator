import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextType } from './authContextValue'
import api, { ACCESS_TOKEN_KEY, clearTokens, storeTokens } from '../services/api'
import type { TokenResponse, User } from '../types'


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)))

  const loadUser = useCallback(async (): Promise<void> => {
    const { data } = await api.get<User>('/auth/me')
    setUser(data)
  }, [])

  const logout = useCallback((): void => {
    clearTokens()
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return
    let active = true
    const bootstrap = async (): Promise<void> => {
      try {
        await loadUser()
      } catch {
        clearTokens()
      }
      if (active) setIsLoading(false)
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [loadUser])

  const setTokens = useCallback(
    async (tokens: TokenResponse): Promise<void> => {
      storeTokens(tokens)
      await loadUser()
    },
    [loadUser],
  )

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const { data } = await api.post<TokenResponse>('/auth/login', form)
      await setTokens(data)
    },
    [setTokens],
  )

  const register = useCallback(
    async (email: string, password: string, fullName: string): Promise<void> => {
      await api.post<User>('/auth/register', { email, password, full_name: fullName })
      await login(email, password)
    },
    [login],
  )

  const value = useMemo<AuthContextType>(
    () => ({ user, isLoading, login, register, setTokens, logout }),
    [user, isLoading, login, register, setTokens, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
