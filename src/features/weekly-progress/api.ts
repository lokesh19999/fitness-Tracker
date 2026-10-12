import type { Tables, TablesUpdate } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type WeeklyProgress = Tables<'weekly_progress'>
export type WeeklyProgressUpdate = TablesUpdate<'weekly_progress'>

export async function fetchWeeklyProgress(userId: string): Promise<WeeklyProgress[]> {
  const { data, error } = await supabase
    .from('weekly_progress')
    .select('*')
    .eq('user_id', userId)
    .order('week_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveWeeklyProgress(
  userId: string,
  weekNumber: number,
  weekStart: string,
  patch: WeeklyProgressUpdate,
): Promise<WeeklyProgress> {
  const existing = patch.id
  if (existing) {
    const { data, error } = await supabase
      .from('weekly_progress')
      .update(patch)
      .eq('id', existing)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase
    .from('weekly_progress')
    .upsert(
      { ...patch, user_id: userId, week_number: weekNumber, week_start: weekStart },
      { onConflict: 'user_id,week_number' },
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteWeeklyProgress(id: string): Promise<void> {
  const { error } = await supabase.from('weekly_progress').delete().eq('id', id)
  if (error) throw new Error(error.message)
}