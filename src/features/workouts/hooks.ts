import { useAuth } from '@/hooks/use-auth'
import { invalidate, useQuery } from '@/hooks/use-query'

import { fetchSessions, fetchTemplates, type TemplateFull, type WorkoutSessionFull } from './api'

export function workoutSessionsKey(userId: string) {
  return `workout_sessions:${userId}`
}
export function workoutTemplatesKey(userId: string) {
  return `workout_templates:${userId}`
}

export function useWorkoutSessions() {
  const { user } = useAuth()
  const { data, ...rest } = useQuery(
    user ? workoutSessionsKey(user.id) : null,
    () => fetchSessions(user!.id),
    { enabled: Boolean(user) },
  )
  return { sessions: data ?? ([] as WorkoutSessionFull[]), ...rest }
}

export function useWorkoutTemplates() {
  const { user } = useAuth()
  const { data, ...rest } = useQuery(
    user ? workoutTemplatesKey(user.id) : null,
    () => fetchTemplates(user!.id),
    { enabled: Boolean(user) },
  )
  return { templates: data ?? ([] as TemplateFull[]), ...rest }
}

export function invalidateWorkouts(userId: string) {
  invalidate(workoutSessionsKey(userId))
  invalidate(workoutTemplatesKey(userId))
}