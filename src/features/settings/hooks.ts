import { invalidate, useQuery } from '@/hooks/use-query'
import { useAuth } from '@/hooks/use-auth'

import { fetchSettings, settingsWithDefaults, type FitnessSettings } from './api'

export function useSettings(): {
  settings: FitnessSettings
  settingsRow: FitnessSettings | null
  loading: boolean
  error: string | null
  refetch: () => void
} {
  const { user } = useAuth()
  const { data, error, loading, refetch } = useQuery(
    user ? `settings:${user.id}` : null,
    () => fetchSettings(user!.id),
    { enabled: Boolean(user) },
  )
  return {
    settings: settingsWithDefaults(data ?? null, user?.id ?? ''),
    settingsRow: data ?? null,
    loading,
    error,
    refetch,
  }
}

export function invalidateSettings(userId: string) {
  invalidate(`settings:${userId}`)
}