import { useAuth } from '@/hooks/use-auth'
import { invalidate, useQuery } from '@/hooks/use-query'

import { fetchDailyLogs, type DailyLog } from './api'

export function dailyLogsKey(userId: string) {
  return `daily_logs:${userId}`
}

export function useDailyLogs(): {
  logs: DailyLog[]
  loading: boolean
  error: string | null
  fetching: boolean
  refetch: () => void
  updatedAt: number | undefined
} {
  const { user } = useAuth()
  const { data, loading, error, fetching, refetch, updatedAt } = useQuery(
    user ? dailyLogsKey(user.id) : null,
    () => fetchDailyLogs(user!.id),
    { enabled: Boolean(user) },
  )
  return { logs: data ?? [], loading, error, fetching, refetch, updatedAt }
}

export function invalidateDailyLogs(userId: string) {
  invalidate(dailyLogsKey(userId))
}