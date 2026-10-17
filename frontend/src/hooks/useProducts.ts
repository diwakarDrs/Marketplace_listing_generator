import { listProducts, type ProductListParams } from '../services/productService'
import type { PaginatedResponse, Product } from '../types'
import { useAsync, type AsyncState } from './useAsync'

export function useProducts(params: ProductListParams): AsyncState<PaginatedResponse<Product>> {
  const { seller_id, search, page, page_size } = params
  return useAsync(() => listProducts({ seller_id, search, page, page_size }), [seller_id, search, page, page_size])
}
