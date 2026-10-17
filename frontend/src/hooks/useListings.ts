import { useCallback, useEffect, useState } from 'react'
import type { Listing, MarketplacesResponse, PaginatedResponse } from '../types'
import {
  fetchListing,
  fetchListings,
  fetchMarketplaces,
  parseListingError,
  type ListingError,
  type ListingFilters,
} from '../services/listingService'

interface AsyncState<T> {
  data: T
  loading: boolean
  error: ListingError | null
  reload: () => void
}

function useFetched<T>(fetcher: () => Promise<T>, initial: T, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<ListingError | null>(null)
  const [tick, setTick] = useState<number>(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetcher()
      .then((result) => {
        if (!active) return
        setData(result)
        setError(null)
      })
      .catch((e: unknown) => {
        if (active) setError(parseListingError(e))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

const EMPTY_LISTINGS: PaginatedResponse<Listing> = { items: [], total: 0, page: 1, page_size: 20 }

export function useListings(filters: ListingFilters): AsyncState<PaginatedResponse<Listing>> {
  const { product_id, marketplace, language, page, page_size } = filters
  return useFetched(() => fetchListings({ product_id, marketplace, language, page, page_size }), EMPTY_LISTINGS, [
    product_id,
    marketplace,
    language,
    page,
    page_size,
  ])
}

export function useListing(id: number): AsyncState<Listing | null> {
  return useFetched<Listing | null>(() => fetchListing(id), null, [id])
}

export function useMarketplaces(): AsyncState<MarketplacesResponse | null> {
  return useFetched<MarketplacesResponse | null>(fetchMarketplaces, null, [])
}
