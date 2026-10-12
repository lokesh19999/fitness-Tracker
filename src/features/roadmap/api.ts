import type { Tables, TablesUpdate } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type RoadmapWeek = Tables<'roadmap_weeks'>
export type RoadmapWeekUpdate = TablesUpdate<'roadmap_weeks'>

export async function fetchRoadmap(userId: string): Promise<RoadmapWeek[]> {
  const { data, error } = await supabase
    .from('roadmap_weeks')
    .select('*')
    .eq('user_id', userId)
    .order('week_number', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveRoadmapWeek(userId: string, week: RoadmapWeekUpdate & { week_number: number }) {
  if (week.id) {
    const { data, error } = await supabase
      .from('roadmap_weeks')
      .update(week)
      .eq('id', week.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase
    .from('roadmap_weeks')
    .upsert({ ...week, user_id: userId }, { onConflict: 'user_id,week_number' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteRoadmapWeek(id: string): Promise<void> {
  const { error } = await supabase.from('roadmap_weeks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}