import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'

export type DailyLog = Tables<'daily_logs'>
export type DailyLogInsert = TablesInsert<'daily_logs'>
export type DailyLogUpdate = TablesUpdate<'daily_logs'>

export async function fetchDailyLogs(userId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchDailyLogByDate(userId: string, date: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', date)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function saveDailyLog(userId: string, entry: DailyLogUpdate & { log_date: string }) {
  const existing = await fetchDailyLogByDate(userId, entry.log_date)
  if (existing) {
    const { data, error } = await supabase
      .from('daily_logs')
      .update(entry)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
  const { data, error } = await supabase
    .from('daily_logs')
    .insert({ ...entry, user_id: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteDailyLog(id: string): Promise<void> {
  const { error } = await supabase.from('daily_logs').delete().eq('id', id)
  if (error) throw new Error(error.message)
}