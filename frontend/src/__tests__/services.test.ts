import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../services/api'
import { getErrorMessage, isValidEmail, oauthErrorMessage, readOAuthCallback } from '../services/authService'
import { getDashboardStats, getUsage } from '../services/dashboardService'
import { fetchListings, parseListingError } from '../services/listingService'
import { apiErrorMessage, parseApiError } from '../lib/apiError'
import { createProduct, deleteProduct, listProductListings, listProducts } from '../services/productService'
import type { Product, ProductInput } from '../types'

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  storeTokens: vi.fn(),
  clearTokens: vi.fn(),
  ACCESS_TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
}))

function axiosErr(status: number | null, data: unknown, code?: string): AxiosError {
  const response =
    status === null
      ? undefined
      : ({ status, data, statusText: '', headers: {}, config: {} } as AxiosResponse)
  return new AxiosError('fail', code, undefined, undefined, response)
}

describe('productService (mocked axios)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listProducts passes params and returns the page', async () => {
    const page = { items: [{ id: 1 }], total: 1, page: 2, page_size: 5 }
    vi.mocked(api.get).mockResolvedValue({ data: page })
    const res = await listProducts({ search: 'lamp', page: 2, page_size: 5 })
    expect(api.get).toHaveBeenCalledWith('/api/products', {
      params: { seller_id: undefined, search: 'lamp', page: 2, page_size: 5 },
    })
    expect(res).toBe(page)
  })

  it('listProducts returns paginated payloads untouched', async () => {
    const page = { items: [], total: 0, page: 1, page_size: 10 }
    vi.mocked(api.get).mockResolvedValue({ data: page })
    expect(await listProducts()).toBe(page)
  })

  it('createProduct and deleteProduct hit the right endpoints', async () => {
    const created = { id: 3, name: 'x' } as Product
    vi.mocked(api.post).mockResolvedValue({ data: created })
    const input: ProductInput = { name: 'x' }
    expect(await createProduct(input)).toBe(created)
    expect(api.post).toHaveBeenCalledWith('/api/products', input)
    vi.mocked(api.delete).mockResolvedValue({})
    await deleteProduct(3)
    expect(api.delete).toHaveBeenCalledWith('/api/products/3')
  })

  it('propagates API failures', async () => {
    vi.mocked(api.get).mockRejectedValue(axiosErr(500, {}))
    await expect(listProducts()).rejects.toBeInstanceOf(AxiosError)
  })
})

describe('dashboardService (mocked axios)', () => {
  it('fetches stats and usage', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { total_listings: 2 } })
    expect(await getDashboardStats()).toEqual({ total_listings: 2 })
    vi.mocked(api.get).mockResolvedValueOnce({ data: { generations_used: 1 } })
    expect(await getUsage()).toEqual({ generations_used: 1 })
    expect(api.get).toHaveBeenLastCalledWith('/api/usage')
  })
})

describe('pagination requests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listProductListings requests page_size 100 and exposes the total', async () => {
    const page = { items: [], total: 150, page: 1, page_size: 100 }
    vi.mocked(api.get).mockResolvedValue({ data: page })
    expect((await listProductListings(7)).total).toBe(150)
    expect(api.get).toHaveBeenCalledWith('/api/listings', { params: { product_id: 7, page: 1, page_size: 100 } })
  })

  it('fetchListings forwards filters and paging', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], total: 0, page: 3, page_size: 20 } })
    await fetchListings({ product_id: 2, marketplace: 'amazon', page: 3 })
    expect(api.get).toHaveBeenCalledWith('/api/listings', {
      params: { product_id: 2, marketplace: 'amazon', page: 3, page_size: 20 },
    })
  })
})

describe('apiError helper', () => {
  it('parses the envelope, detail variants and network errors', () => {
    expect(parseApiError(axiosErr(429, { error: { code: 'rate_limited', message: 'slow' } }))).toMatchObject({
      status: 429,
      code: 'rate_limited',
      message: 'slow',
      network: false,
    })
    expect(parseApiError(axiosErr(400, { detail: { message: 'obj' } })).message).toBe('obj')
    expect(parseApiError(axiosErr(null, undefined)).network).toBe(true)
    expect(parseApiError(new Error('x'))).toEqual({ network: false })
    expect(apiErrorMessage(axiosErr(500, {}), 'fb')).toBe('fb')
  })
})

describe('authService helpers', () => {
  it('validates emails', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('a b@c.com')).toBe(false)
  })

  it('extracts messages from the backend error envelope, detail string and detail array', () => {
    const envelope = axiosErr(409, { error: { code: 'conflict', message: 'Email already registered' } })
    expect(getErrorMessage(envelope, 'x')).toBe('Email already registered')
    expect(getErrorMessage(axiosErr(400, { detail: 'Bad' }), 'x')).toBe('Bad')
    expect(getErrorMessage(axiosErr(422, { detail: [{ msg: 'too short' }] }), 'x')).toBe('too short')
    expect(getErrorMessage(axiosErr(null, undefined), 'x')).toMatch(/cannot reach/i)
    expect(getErrorMessage(new Error('plain'), 'fallback')).toBe('fallback')
  })

  it('reads OAuth tokens from the hash fragment or errors from the query', () => {
    const ok = readOAuthCallback('', '#access_token=a&refresh_token=r&token_type=bearer')
    expect(ok.tokens).toEqual({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })
    expect(readOAuthCallback('?error=oauth_denied', '')).toEqual({ tokens: null, error: oauthErrorMessage('oauth_denied') })
    expect(oauthErrorMessage('<script>alert(1)</script>')).toBe(oauthErrorMessage('unknown'))
    expect(oauthErrorMessage('inactive')).not.toBe(oauthErrorMessage('unknown'))
    expect(oauthErrorMessage('__proto__')).toBe(oauthErrorMessage('unknown'))
    // tokens in the query string are ignored
    expect(readOAuthCallback('?access_token=a&refresh_token=r', '').tokens).toBeNull()
    expect(readOAuthCallback('', '')).toEqual({ tokens: null, error: null })
  })
})

describe('parseListingError', () => {
  it('classifies quota, ai and validation errors using the backend envelope', () => {
    const quota = parseListingError(
      axiosErr(429, { error: { code: 'quota_exceeded', message: 'Monthly generation limit reached' } }),
    )
    expect(quota).toEqual({ kind: 'quota', message: 'Monthly generation limit reached' })
    expect(parseListingError(axiosErr(429, { error: { code: 'rate_limited', message: 'x' } }))).toEqual({
      kind: 'rate_limit',
      message: 'Too many requests, wait a minute and try again.',
    })
    expect(parseListingError(axiosErr(502, { error: { code: 'ai_service_error', message: 'down' } })).kind).toBe('ai')
    expect(parseListingError(axiosErr(502, { error: { message: 'AI service request failed' } })).kind).toBe('ai')
    expect(parseListingError(axiosErr(422, { detail: [{ msg: 'bad' }] }))).toEqual({
      kind: 'validation',
      message: 'bad',
    })
    expect(parseListingError(axiosErr(null, undefined, 'ECONNABORTED')).kind).toBe('ai')
    expect(parseListingError(new Error('x')).kind).toBe('other')
  })
})
