import api from './api'
import type { PaginatedResponse, SellerProfile, SellerProfileInput } from '../types'

export async function listSellers(page = 1, pageSize = 100): Promise<PaginatedResponse<SellerProfile>> {
  const res = await api.get<PaginatedResponse<SellerProfile>>('/api/sellers', {
    params: { page, page_size: pageSize },
  })
  return res.data
}

export async function getSeller(id: number): Promise<SellerProfile> {
  const res = await api.get<SellerProfile>(`/api/sellers/${id}`)
  return res.data
}

export async function createSeller(input: SellerProfileInput): Promise<SellerProfile> {
  const res = await api.post<SellerProfile>('/api/sellers', input)
  return res.data
}

export async function updateSeller(id: number, input: SellerProfileInput): Promise<SellerProfile> {
  const res = await api.put<SellerProfile>(`/api/sellers/${id}`, input)
  return res.data
}

export async function deleteSeller(id: number): Promise<void> {
  await api.delete(`/api/sellers/${id}`)
}
