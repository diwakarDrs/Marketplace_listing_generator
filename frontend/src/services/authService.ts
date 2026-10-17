import { apiErrorMessage } from '../lib/apiError'
import api, { storeTokens } from './api'
import type { TokenResponse, User } from '../types'

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/** Backend endpoint that starts the Google OAuth flow. */
export const GOOGLE_AUTH_URL = `${API_URL}/auth/google`

export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

/** Extracts a human readable message from an API/axios error. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return apiErrorMessage(error, fallback)
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

const OAUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  oauth_denied: 'Google sign-in was cancelled.',
  oauth_state: 'Google sign-in expired or was tampered with. Please try again.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  oauth_email: 'Your Google account has no verified email address.',
  inactive: 'This account is inactive.',
}
const GENERIC_OAUTH_ERROR = 'Google sign-in failed. Please try again.'

/** Maps the backend `error` query value to a fixed message (never echoes URL content). */
export function oauthErrorMessage(code: string): string {
  return Object.hasOwn(OAUTH_ERROR_MESSAGES, code) ? OAUTH_ERROR_MESSAGES[code] : GENERIC_OAUTH_ERROR
}

/**
 * Reads the OAuth callback returned by the backend redirect.
 * Tokens are accepted ONLY from the URL fragment (never the query string, which
 * leaks via logs/referrers):  /login#access_token=<jwt>&refresh_token=<jwt>
 * Errors arrive as /login?error=<code> and are mapped to a fixed whitelist of messages.
 */
export function readOAuthCallback(search: string, hash: string): { tokens: TokenResponse | null; error: string | null } {
  const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const access = hashParams.get('access_token')
  const refresh = hashParams.get('refresh_token')
  if (access && refresh) {
    return { tokens: { access_token: access, refresh_token: refresh, token_type: 'bearer' }, error: null }
  }
  const code = new URLSearchParams(search).get('error') ?? hashParams.get('error')
  return { tokens: null, error: code ? oauthErrorMessage(code) : null }
}

/** Removes tokens/error from the address bar and history entry. */
export function clearOAuthParams(): void {
  window.history.replaceState(window.history.state, '', window.location.pathname)
}

// TODO: tokens live in localStorage (readable by any XSS). Moving to httpOnly,
// SameSite cookies set by the backend would remove that exposure, at the cost of
// CSRF handling and backend changes.
export function saveOAuthTokens(tokens: TokenResponse): void {
  storeTokens(tokens)
}
