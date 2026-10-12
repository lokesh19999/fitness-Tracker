import { useAuth } from '@/hooks/use-auth'
import { invalidate, useQuery } from '@/hooks/use-query'

import { fetchMeals, type MealEntry } from './api'

export function mealsKey(userId: string) {
  return `meals:${userId}`
}

export function useMeals() {
  const { user } = useAuth()
  const { data, ...rest } = useQuery(
    user ? mealsKey(user.id) : null,
    () => fetchMeals(user!.id),
    { enabled: Boolean(user) },
  )
  return { meals: data ?? ([] as MealEntry[]), ...rest }
}

export function invalidateMeals(userId: string) {
  invalidate(mealsKey(userId))
}