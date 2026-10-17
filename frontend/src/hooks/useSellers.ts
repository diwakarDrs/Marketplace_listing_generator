import { listSellers } from '../services/sellerService'
import type { PaginatedResponse, SellerProfile } from '../types'
import { useAsync, type AsyncState } from './useAsync'

export function useSellers(page = 1, pageSize = 100): AsyncState<PaginatedResponse<SellerProfile>> {
  return useAsync(() => listSellers(page, pageSize), [page, pageSize])
}
