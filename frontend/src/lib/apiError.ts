import axios from 'axios'

export interface ParsedApiError {
  /** HTTP status, undefined when the server was unreachable. */
  status?: number
  /** Machine readable code from the backend envelope, e.g. `rate_limited`. */
  code?: string
  /** Human readable message, if the response carried one. */
  message?: string
  /** True when the request never got a response. */
  network: boolean
}

interface ErrorBody {
  detail?: unknown
  message?: unknown
  error?: { code?: unknown; message?: unknown }
}

function detailMessage(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail || undefined
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (d && typeof d === 'object' ? (d as { msg?: unknown }).msg : undefined))
      .filter((m): m is string => typeof m === 'string' && m.length > 0)
    return msgs.length ? msgs.join('; ') : undefined
  }
  if (detail && typeof detail === 'object') {
    const m = (detail as { message?: unknown }).message
    if (typeof m === 'string' && m) return m
  }
  return undefined
}

/**
 * Single place that understands the backend error shapes:
 * `{"error":{"code","message"}}`, FastAPI `{"detail": string | [{msg}] | {message}}`
 * and `{"message"}`.
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (!axios.isAxiosError(error)) return { network: false }
  const body = error.response?.data as ErrorBody | undefined
  const envelope = body && typeof body === 'object' ? body.error : undefined
  const code = typeof envelope?.code === 'string' ? envelope.code : undefined
  let message = detailMessage(body && typeof body === 'object' ? body.detail : undefined)
  if (!message && typeof envelope?.message === 'string' && envelope.message) message = envelope.message
  if (!message && body && typeof body === 'object' && typeof body.message === 'string' && body.message) message = body.message
  return { status: error.response?.status, code, message, network: !error.response }
}

/** Human readable message for any thrown value. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const parsed = parseApiError(error)
  if (parsed.message) return parsed.message
  if (parsed.network && axios.isAxiosError(error) && error.code !== 'ECONNABORTED') {
    return 'Cannot reach the server. Please try again.'
  }
  return fallback
}
