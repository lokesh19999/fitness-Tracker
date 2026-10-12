import { useAuth } from '@/hooks/use-auth'
import { invalidate, useQuery } from '@/hooks/use-query'

import { fetchRoadmap, type RoadmapWeek } from './api'

export function roadmapKey(userId: string) {
  return `roadmap:${userId}`
}

export function useRoadmap() {
  const { user } = useAuth()
  const { data, ...rest } = useQuery(
    user ? roadmapKey(user.id) : null,
    () => fetchRoadmap(user!.id),
    { enabled: Boolean(user) },
  )
  return { roadmap: data ?? ([] as RoadmapWeek[]), ...rest }
}

export function invalidateRoadmap(userId: string) {
  invalidate(roadmapKey(userId))
}