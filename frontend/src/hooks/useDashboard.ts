import { useCallback, useEffect, useState } from 'react'
import { getDashboardStats, getUsage } from '../services/dashboardService'
import type { DashboardStats, UsageInfo } from '../types'

interface UseDashboardResult {
  stats: DashboardStats | null
  usage: UsageInfo | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

export function useDashboard(): UseDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [usage, setUsage] = useState<UsageInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([getDashboardStats(), getUsage()])
      .then(([s, u]) => {
        if (cancelled) return
        setStats(s)
        setUsage(u)
        setError(null)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your dashboard. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setTick((t) => t + 1)
  }, [])

  return { stats, usage, isLoading, error, reload }
}
