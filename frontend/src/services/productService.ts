import api from './api'
import type { Listing, PaginatedResponse, Product, ProductInput } from '../types'

export interface ProductListParams {
  seller_id?: number
  search?: string
  page?: number
  page_size?: number
}

export async function listProducts(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
  const res = await api.get<PaginatedResponse<Product>>('/api/products', {
    params: {
      seller_id: params.seller_id,
      search: params.search || undefined,
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
    },
  })
  return res.data
}

export async function getProduct(id: number): Promise<Product> {
  const res = await api.get<Product>(`/api/products/${id}`)
  return res.data
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const res = await api.post<Product>('/api/products', input)
  return res.data
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const res = await api.put<Product>(`/api/products/${id}`, input)
  return res.data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/api/products/${id}`)
}

export const PRODUCT_LISTINGS_LIMIT = 100

export async function listProductListings(productId: number): Promise<PaginatedResponse<Listing>> {
  const res = await api.get<PaginatedResponse<Listing>>('/api/listings', {
    params: { product_id: productId, page: 1, page_size: PRODUCT_LISTINGS_LIMIT },
  })
  return res.data
}
