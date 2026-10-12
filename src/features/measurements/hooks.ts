import { useAuth } from '@/hooks/use-auth'
import { invalidate, useQuery } from '@/hooks/use-query'

import { fetchMeasurements, type BodyMeasurement } from './api'

export function measurementsKey(userId: string) {
  return `measurements:${userId}`
}

export function useMeasurements() {
  const { user } = useAuth()
  const { data, ...rest } = useQuery(
    user ? measurementsKey(user.id) : null,
    () => fetchMeasurements(user!.id),
    { enabled: Boolean(user) },
  )
  return { measurements: data ?? ([] as BodyMeasurement[]), ...rest }
}

export function invalidateMeasurements(userId: string) {
  invalidate(measurementsKey(userId))
}