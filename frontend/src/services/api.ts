import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { TokenResponse } from '../types'

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const ACCESS_TOKEN_KEY = 'access_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({ baseURL: API_URL })

export function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<TokenResponse> | null = null

function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<TokenResponse>(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => res.data)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const isAuthCall = original?.url?.startsWith('/auth/') ?? false
    if (error.response?.status === 401 && original && !original._retry && refreshToken && !isAuthCall) {
      original._retry = true
      try {
        const tokens = await refreshTokens(refreshToken)
        storeTokens(tokens)
        original.headers.Authorization = `Bearer ${tokens.access_token}`
        return api(original)
      } catch (refreshError) {
        clearTokens()
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export default api
