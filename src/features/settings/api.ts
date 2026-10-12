import type { Tables } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type FitnessSettings = Tables<'fitness_settings'>

export const DEFAULT_SETTINGS: Omit<FitnessSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  programme_start_date: new Date().toISOString().slice(0, 10),
  starting_weight_kg: null,
  starting_waist_cm: null,
  target_calories: 2100,
  target_protein_g: 135,
  target_carbs_g: 250,
  target_fat_g: 62,
  target_water_l: 2.5,
  target_steps: 8000,
  target_sleep_hours: 7.5,
  goals: null,
  units: 'metric',
  theme: 'system',
}

export async function fetchSettings(userId: string): Promise<FitnessSettings | null> {
  const { data, error } = await supabase
    .from('fitness_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function upsertSettings(
  userId: string,
  patch: Partial<FitnessSettings>,
): Promise<FitnessSettings> {
  const existing = await fetchSettings(userId)
  if (existing) {
    const { data, error } = await supabase
      .from('fitness_settings')
      .update(patch)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase
    .from('fitness_settings')
    .insert({ ...DEFAULT_SETTINGS, ...patch, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export function settingsWithDefaults(row: FitnessSettings | null, userId: string): FitnessSettings {
  if (row) return row
  const now = new Date().toISOString()
  return {
    id: 'local',
    user_id: userId,
    ...DEFAULT_SETTINGS,
    created_at: now,
    updated_at: now,
  }
}