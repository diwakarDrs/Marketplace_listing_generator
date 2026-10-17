import { AxiosError } from 'axios'
import api from './api'
import { parseApiError } from '../lib/apiError'
import type {
  GenerateListingRequest,
  Listing,
  ListingUpdateInput,
  MarketplaceId,
  MarketplacesResponse,
  PaginatedResponse,
  RegenerateListingRequest,
} from '../types'

export interface ListingFilters {
  product_id?: number
  marketplace?: MarketplaceId
  language?: string
  page?: number
  page_size?: number
}

export const LISTINGS_PAGE_SIZE = 20

export type ExportFormat = 'text' | 'csv'

export type ListingErrorKind = 'quota' | 'rate_limit' | 'ai' | 'validation' | 'other'

export interface ListingError {
  kind: ListingErrorKind
  message: string
}

export async function fetchMarketplaces(): Promise<MarketplacesResponse> {
  const res = await api.get<MarketplacesResponse>('/api/marketplaces')
  return res.data
}

export async function fetchListings(filters: ListingFilters = {}): Promise<PaginatedResponse<Listing>> {
  const params: Record<string, string | number> = {}
  if (filters.product_id) params.product_id = filters.product_id
  if (filters.marketplace) params.marketplace = filters.marketplace
  if (filters.language) params.language = filters.language
  params.page = filters.page ?? 1
  params.page_size = filters.page_size ?? LISTINGS_PAGE_SIZE
  const res = await api.get<PaginatedResponse<Listing>>('/api/listings', { params })
  return res.data
}

export async function fetchListing(id: number): Promise<Listing> {
  const res = await api.get<Listing>(`/api/listings/${id}`)
  return res.data
}

export async function generateListing(payload: GenerateListingRequest): Promise<Listing> {
  const res = await api.post<Listing>('/api/listings/generate', payload, { timeout: 120000 })
  return res.data
}

export async function updateListing(id: number, payload: ListingUpdateInput): Promise<Listing> {
  const res = await api.put<Listing>(`/api/listings/${id}`, payload)
  return res.data
}

export async function regenerateListing(id: number, payload: RegenerateListingRequest): Promise<Listing> {
  const res = await api.post<Listing>(`/api/listings/${id}/regenerate`, payload, { timeout: 120000 })
  return res.data
}

export async function deleteListing(id: number): Promise<void> {
  await api.delete(`/api/listings/${id}`)
}

export async function downloadExport(id: number, format: ExportFormat): Promise<void> {
  const res = await api.get<Blob>(`/api/listings/${id}/export`, {
    params: { format },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `listing-${id}.${format === 'csv' ? 'csv' : 'txt'}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function parseListingError(error: unknown): ListingError {
  if (error instanceof AxiosError) {
    const { status, code, message } = parseApiError(error)

    if (code === 'rate_limited' || (status === 429 && code !== 'quota_exceeded')) {
      return { kind: 'rate_limit', message: 'Too many requests, wait a minute and try again.' }
    }
    if (code === 'quota_exceeded' || (status === 403 && /quota|limit/i.test(message ?? ''))) {
      return {
        kind: 'quota',
        message: message || 'You have used all generations for this month. Upgrade your plan or wait for the next period.',
      }
    }
    if (code === 'ai_service_error' || status === 502 || status === 503 || status === 504 || error.code === 'ECONNABORTED') {
      return {
        kind: 'ai',
        message: message || 'The AI service did not respond in time. Please try again in a moment.',
      }
    }
    if (status === 422 || status === 400) {
      return { kind: 'validation', message: message || 'The request was invalid. Please check your selection.' }
    }
    if (message) return { kind: 'other', message }
  }
  return { kind: 'other', message: 'Something went wrong. Please try again.' }
}
