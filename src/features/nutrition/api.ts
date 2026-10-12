import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type MealEntry = Tables<'meal_entries'>
export type MealEntryInsert = TablesInsert<'meal_entries'>
export type MealEntryUpdate = TablesUpdate<'meal_entries'>

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'] as const

export async function fetchMeals(userId: string): Promise<MealEntry[]> {
  const { data, error } = await supabase
    .from('meal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function saveMeal(
  userId: string,
  entry: MealEntryUpdate & { log_date: string; meal_type: string; food: string },
): Promise<MealEntry> {
  if (entry.id) {
    const { data, error } = await supabase
      .from('meal_entries')
      .update(entry)
      .eq('id', entry.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase
    .from('meal_entries')
    .insert({ ...entry, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meal_entries').delete().eq('id', id)
  if (error) throw new Error(error.message)
}