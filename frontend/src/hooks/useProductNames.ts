import { useEffect, useState } from 'react'
import { getProduct } from '../services/productService'

const nameCache = new Map<number, string>()

/** Resolves product names for the given ids (cached across renders/pages). */
export function useProductNames(ids: readonly number[]): ReadonlyMap<number, string> {
  const [names, setNames] = useState<ReadonlyMap<number, string>>(() => new Map(nameCache))
  const key = [...new Set(ids)].sort((a, b) => a - b).join(',')

  useEffect(() => {
    const missing = key ? key.split(',').map(Number).filter((id) => !nameCache.has(id)) : []
    if (missing.length === 0) return
    let active = true
    void Promise.allSettled(missing.map((id) => getProduct(id))).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') nameCache.set(missing[i], r.value.name)
      })
      if (active) setNames(new Map(nameCache))
    })
    return () => {
      active = false
    }
  }, [key])

  return names
}
