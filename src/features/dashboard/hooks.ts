import { useMemo } from 'react'

import { useDailyLogs } from '@/features/daily-log/hooks'
import { useMeals } from '@/features/nutrition/hooks'
import { useMeasurements } from '@/features/measurements/hooks'
import { useSettings } from '@/features/settings/hooks'
import { useWeeklyProgress } from '@/features/weekly-progress/hooks'
import { useWorkoutSessions } from '@/features/workouts/hooks'
import { refetchAll } from '@/hooks/use-query'

import { buildDashboard, type DashboardData } from './compute'

export interface DashboardResult {
  data: DashboardData
  loading: boolean
  error: string | null
  fetching: boolean
  updatedAt: number | undefined
  refresh: () => void
}

export interface DateRange {
  from?: string
  to?: string
}

export function useDashboardData(range?: DateRange): DashboardResult {
  const logsQ = useDailyLogs()
  const mealsQ = useMeals()
  const sessionsQ = useWorkoutSessions()
  const measurementsQ = useMeasurements()
  const weeklyQ = useWeeklyProgress()
  const settingsQ = useSettings()

  const inRange = (d: string) => (!range?.from || d >= range.from) && (!range?.to || d <= range.to)

  const data = useMemo(
    () =>
      buildDashboard({
        logs: logsQ.logs.filter((l) => inRange(l.log_date)),
        meals: mealsQ.meals.filter((m) => inRange(m.log_date)),
        sessions: sessionsQ.sessions.filter((s) => inRange(s.session.session_date)),
        measurements: measurementsQ.measurements.filter((m) => inRange(m.measured_on)),
        weekly: weeklyQ.weekly,
        settings: settingsQ.settings,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      logsQ.logs,
      mealsQ.meals,
      sessionsQ.sessions,
      measurementsQ.measurements,
      weeklyQ.weekly,
      settingsQ.settings,
      range?.from,
      range?.to,
    ],
  )

  const loading =
    logsQ.loading || mealsQ.loading || sessionsQ.loading || measurementsQ.loading || weeklyQ.loading || settingsQ.loading
  const error =
    logsQ.error || mealsQ.error || sessionsQ.error || measurementsQ.error || weeklyQ.error || settingsQ.error
  const fetching =
    logsQ.fetching || mealsQ.fetching || sessionsQ.fetching || measurementsQ.fetching || weeklyQ.fetching
  const updatedAt =
    Math.max(
      logsQ.updatedAt ?? 0,
      mealsQ.updatedAt ?? 0,
      sessionsQ.updatedAt ?? 0,
      measurementsQ.updatedAt ?? 0,
      weeklyQ.updatedAt ?? 0,
    ) || undefined

  return { data, loading, error, fetching, updatedAt, refresh: refetchAll }
}