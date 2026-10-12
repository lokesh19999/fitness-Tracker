import { supabase } from '@/lib/supabase'
import type { ExportPayload, SheetName } from '@/utils/export-import'
import { normalizeDate, normalizeNumber } from '@/utils/export-import'

export const IMPORT_TARGETS: { value: SheetName; label: string }[] = [
  { value: 'daily_logs', label: 'Daily logs' },
  { value: 'meal_entries', label: 'Meals' },
  { value: 'body_measurements', label: 'Measurements' },
  { value: 'weekly_progress', label: 'Weekly progress' },
]

export const FIELD_DEFS: Record<string, { key: string; label: string; type: 'date' | 'number' | 'text' | 'bool' }[]> = {
  daily_logs: [
    { key: 'log_date', label: 'Date', type: 'date' },
    { key: 'morning_weight_kg', label: 'Morning weight (kg)', type: 'number' },
    { key: 'calories', label: 'Calories', type: 'number' },
    { key: 'protein_g', label: 'Protein (g)', type: 'number' },
    { key: 'carbs_g', label: 'Carbs (g)', type: 'number' },
    { key: 'fat_g', label: 'Fat (g)', type: 'number' },
    { key: 'steps', label: 'Steps', type: 'number' },
    { key: 'water_l', label: 'Water (L)', type: 'number' },
    { key: 'sleep_hours', label: 'Sleep (h)', type: 'number' },
    { key: 'energy_rating', label: 'Energy (1-5)', type: 'number' },
    { key: 'face_skin_rating', label: 'Face/skin (1-5)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
  meal_entries: [
    { key: 'log_date', label: 'Date', type: 'date' },
    { key: 'meal_type', label: 'Meal', type: 'text' },
    { key: 'food', label: 'Food', type: 'text' },
    { key: 'portion', label: 'Portion', type: 'text' },
    { key: 'calories', label: 'Calories', type: 'number' },
    { key: 'protein_g', label: 'Protein (g)', type: 'number' },
    { key: 'carbs_g', label: 'Carbs (g)', type: 'number' },
    { key: 'fat_g', label: 'Fat (g)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
  body_measurements: [
    { key: 'measured_on', label: 'Date', type: 'date' },
    { key: 'weight_kg', label: 'Weight (kg)', type: 'number' },
    { key: 'waist_cm', label: 'Waist (cm)', type: 'number' },
    { key: 'hip_cm', label: 'Hip (cm)', type: 'number' },
    { key: 'chest_cm', label: 'Chest (cm)', type: 'number' },
    { key: 'thigh_cm', label: 'Thigh (cm)', type: 'number' },
    { key: 'arm_cm', label: 'Arm (cm)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
  weekly_progress: [
    { key: 'week_number', label: 'Week number', type: 'number' },
    { key: 'week_start', label: 'Week start', type: 'date' },
    { key: 'avg_weight_kg', label: 'Avg weight (kg)', type: 'number' },
    { key: 'waist_cm', label: 'Waist (cm)', type: 'number' },
    { key: 'hip_cm', label: 'Hip (cm)', type: 'number' },
    { key: 'hip_thrust_kg', label: 'Hip thrust (kg)', type: 'number' },
    { key: 'core_benchmark', label: 'Core benchmark', type: 'text' },
    { key: 'avg_daily_steps', label: 'Avg steps', type: 'number' },
    { key: 'avg_sleep_hours', label: 'Avg sleep (h)', type: 'number' },
    { key: 'energy_face_rating', label: 'Energy/face rating', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ],
}

export async function collectExportPayload(userId: string): Promise<ExportPayload> {
  async function table(name: string) {
    const { data, error } = await supabase.from(name as never).select('*').eq('user_id', userId)
    if (error) throw new Error(`${name}: ${error.message}`)
    return (data ?? []) as Record<string, unknown>[]
  }
  const [
    daily_logs,
    weekly_progress,
    meal_entries,
    body_measurements,
    workout_sessions,
    workout_exercises,
    workout_sets,
    roadmap_weeks,
    fitness_settings,
  ] = await Promise.all([
    table('daily_logs'),
    table('weekly_progress'),
    table('meal_entries'),
    table('body_measurements'),
    table('workout_sessions'),
    table('workout_exercises'),
    table('workout_sets'),
    table('roadmap_weeks'),
    table('fitness_settings'),
  ])
  return {
    daily_logs,
    weekly_progress,
    meal_entries,
    body_measurements,
    workout_sessions,
    workout_exercises,
    workout_sets,
    roadmap_weeks,
    fitness_settings,
  }
}

export interface ImportResult {
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

function mapRow(
  row: Record<string, unknown>,
  mapping: Record<string, string>,
  target: SheetName,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const def of FIELD_DEFS[target]) {
    const sourceCol = mapping[def.key]
    if (!sourceCol) continue
    const raw = row[sourceCol]
    if (def.type === 'date') out[def.key] = normalizeDate(raw)
    else if (def.type === 'number') out[def.key] = normalizeNumber(raw)
    else out[def.key] = raw === '' ? null : raw
  }
  return out
}

export async function runImport(
  userId: string,
  target: SheetName,
  rows: Record<string, unknown>[],
  mapping: Record<string, string>,
): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] }

  for (const [index, raw] of rows.entries()) {
    const mapped = mapRow(raw, mapping, target)
    try {
      if (target === 'daily_logs') {
        if (!mapped.log_date) { result.skipped += 1; continue }
        const { data: existing } = await supabase
          .from('daily_logs').select('id').eq('user_id', userId).eq('log_date', mapped.log_date as string).maybeSingle()
        if (existing) {
          const { error } = await supabase.from('daily_logs').update(mapped as never).eq('id', existing.id)
          if (error) throw error
          result.updated += 1
        } else {
          const { error } = await supabase.from('daily_logs').insert({ ...mapped, user_id: userId } as never)
          if (error) throw error
          result.inserted += 1
        }
      } else if (target === 'meal_entries') {
        if (!mapped.log_date || !mapped.food) { result.skipped += 1; continue }
        const { data: existing } = await supabase
          .from('meal_entries').select('id')
          .eq('user_id', userId).eq('log_date', mapped.log_date as string)
          .eq('food', mapped.food as string).maybeSingle()
        if (existing) { result.skipped += 1; continue }
        const { error } = await supabase.from('meal_entries').insert({ ...mapped, user_id: userId } as never)
        if (error) throw error
        result.inserted += 1
      } else if (target === 'body_measurements') {
        if (!mapped.measured_on) { result.skipped += 1; continue }
        const { data: existing } = await supabase
          .from('body_measurements').select('id')
          .eq('user_id', userId).eq('measured_on', mapped.measured_on as string).maybeSingle()
        if (existing) { result.skipped += 1; continue }
        const { error } = await supabase.from('body_measurements').insert({ ...mapped, user_id: userId } as never)
        if (error) throw error
        result.inserted += 1
      } else if (target === 'weekly_progress') {
        if (!mapped.week_number) { result.skipped += 1; continue }
        const { error } = await supabase
          .from('weekly_progress')
          .upsert({ ...mapped, user_id: userId } as never, { onConflict: 'user_id,week_number' })
        if (error) throw error
        result.inserted += 1
      }
    } catch (e) {
      result.errors.push(`Row ${index + 2}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }
  return result
}

export async function restoreBackup(userId: string, payload: ExportPayload): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] }
  const order: SheetName[] = [
    'daily_logs',
    'weekly_progress',
    'meal_entries',
    'body_measurements',
    'roadmap_weeks',
    'fitness_settings',
  ]
  for (const name of order) {
    const rows = payload[name] ?? []
    for (const row of rows) {
      const clean: Record<string, unknown> = { ...row, user_id: userId }
      delete clean.created_at
      delete clean.updated_at
      try {
        if (name === 'weekly_progress' || name === 'roadmap_weeks' || name === 'fitness_settings') {
          const { error } = await supabase.from(name as never).upsert(clean as never, { onConflict: 'user_id,week_number' })
          if (error && name === 'fitness_settings') {
            const { error: e2 } = await supabase.from('fitness_settings').upsert(clean as never, { onConflict: 'user_id' })
            if (e2) throw e2
          } else if (error) throw error
        } else {
          delete (clean as { id?: unknown }).id
          const { error } = await supabase.from(name as never).insert(clean as never)
          if (error) throw error
        }
        result.inserted += 1
      } catch (e) {
        result.errors.push(`${name}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }
  }
  return result
}