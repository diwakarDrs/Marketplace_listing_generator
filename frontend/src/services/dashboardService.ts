import api from './api'
import type { DashboardStats, UsageInfo } from '../types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>('/api/dashboard/stats')
  return res.data
}

export async function getUsage(): Promise<UsageInfo> {
  const res = await api.get<UsageInfo>('/api/usage')
  return res.data
}
