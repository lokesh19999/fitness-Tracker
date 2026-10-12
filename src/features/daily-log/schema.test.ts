import { describe, expect, it } from 'vitest'

import { dailyLogSchema, normalizeDailyLog } from './schema'

const base = {
  log_date: '2026-01-05',
  workout_completed: false,
}

describe('dailyLogSchema', () => {
  it('accepts empty-string numeric fields', () => {
    const parsed = dailyLogSchema.safeParse({ ...base, morning_weight_kg: '', calories: '' })
    expect(parsed.success).toBe(true)
  })

  it('rejects out-of-range and non-numeric values', () => {
    expect(dailyLogSchema.safeParse({ ...base, morning_weight_kg: '5' }).success).toBe(false)
    expect(dailyLogSchema.safeParse({ ...base, calories: 'abc' }).success).toBe(false)
  })

  it('rejects non-integer steps and out-of-range ratings', () => {
    expect(dailyLogSchema.safeParse({ ...base, steps: '12.5' }).success).toBe(false)
    expect(dailyLogSchema.safeParse({ ...base, energy_rating: '9' }).success).toBe(false)
  })
})

describe('normalizeDailyLog', () => {
  it('converts empty strings to null and numeric strings to numbers', () => {
    const parsed = dailyLogSchema.parse({
      ...base,
      morning_weight_kg: '68.4',
      calories: '',
      steps: '8000',
      notes: '',
    })
    const normalized = normalizeDailyLog(parsed)
    expect(normalized.morning_weight_kg).toBe(68.4)
    expect(normalized.calories).toBeNull()
    expect(normalized.steps).toBe(8000)
    expect(normalized.notes).toBeNull()
    expect(normalized.workout_completed).toBe(false)
  })
})
