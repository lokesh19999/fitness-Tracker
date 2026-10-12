import { useAuth } from '@/hooks/use-auth'
import { invalidate, useQuery } from '@/hooks/use-query'

import { fetchWeeklyProgress, type WeeklyProgress } from './api'

export function weeklyProgressKey(userId: string) {
  return `weekly_progress:${userId}`
}

export function useWeeklyProgress() {
  const { user } = useAuth()
  const { data, ...rest } = useQuery(
    user ? weeklyProgressKey(user.id) : null,
    () => fetchWeeklyProgress(user!.id),
    { enabled: Boolean(user) },
  )
  return { weekly: data ?? ([] as WeeklyProgress[]), ...rest }
}

export function invalidateWeeklyProgress(userId: string) {
  invalidate(weeklyProgressKey(userId))
}