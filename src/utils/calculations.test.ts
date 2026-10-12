import { describe, expect, it } from 'vitest'

import {
  average,
  mealTotals,
  nutritionAdherence,
  percentOfTarget,
  resolveDailyNutrition,
  round,
  strengthProgression,
  sum,
  waistChange,
  weeklyAverageWeight,
  weightChange,
  workoutCompletion,
} from './calculations'

describe('average / sum', () => {
  it('excludes missing and non-finite values instead of treating them as zero', () => {
    expect(average([70, null, undefined, 72])).toBe(71)
    expect(sum([10, null, 5, undefined, NaN])).toBe(15)
  })

  it('returns null when there is no valid data', () => {
    expect(average([null, undefined])).toBeNull()
    expect(sum([null, NaN])).toBeNull()
  })
})

describe('round', () => {
  it('rounds to the requested precision and passes through null', () => {
    expect(round(1.2345, 2)).toBe(1.23)
    expect(round(1.2356, 2)).toBe(1.24)
    expect(round(null)).toBeNull()
  })
})

describe('weightChange / waistChange', () => {
  it('computes latest minus starting', () => {
    expect(weightChange(70, 68.4)).toBe(-1.6)
    expect(waistChange(80, 75)).toBe(-5)
  })

  it('returns null when either side is missing', () => {
    expect(weightChange(null, 68)).toBeNull()
    expect(weightChange(70, null)).toBeNull()
  })
})

describe('workoutCompletion', () => {
  it('is completed / planned as a percentage', () => {
    expect(workoutCompletion(3, 4)).toBe(75)
  })

  it('clamps to 0..100 and guards division by zero', () => {
    expect(workoutCompletion(5, 4)).toBe(100)
    expect(workoutCompletion(0, 4)).toBe(0)
    expect(workoutCompletion(2, 0)).toBeNull()
  })
})

describe('nutritionAdherence', () => {
  it('is eligible / days-with-data as a percentage', () => {
    expect(nutritionAdherence(5, 7)).toBe(71.4)
  })

  it('returns null without data', () => {
    expect(nutritionAdherence(0, 0)).toBeNull()
  })
})

describe('mealTotals', () => {
  it('sums macros across meals and skips missing values', () => {
    const totals = mealTotals([
      { calories: 500, protein_g: 40, carbs_g: 50, fat_g: 10, water_l: 0.5 },
      { calories: 300, protein_g: null, carbs_g: 20, fat_g: null, water_l: null },
    ])
    expect(totals).toEqual({
      calories: 800,
      protein_g: 40,
      carbs_g: 70,
      fat_g: 10,
      water_l: 0.5,
      mealCount: 2,
    })
  })

  it('returns nulls (not zero) when no meals have data', () => {
    const totals = mealTotals([{ calories: null, protein_g: null, carbs_g: null, fat_g: null, water_l: null }])
    expect(totals.calories).toBeNull()
    expect(totals.mealCount).toBe(1)
  })
})

describe('resolveDailyNutrition (no double counting)', () => {
  it('uses only meal totals when the day has meals', () => {
    const result = resolveDailyNutrition({
      source: 'meals',
      meals: [{ calories: 500, protein_g: 40, carbs_g: 50, fat_g: 10, water_l: 0.5 }],
      manual: { calories: 9999 },
    })
    expect(result.calories).toBe(500)
    expect(result.mealCount).toBe(1)
  })

  it('uses only manual totals when there are no meals', () => {
    const result = resolveDailyNutrition({
      source: 'manual',
      manual: { calories: 2000, protein_g: 130 },
    })
    expect(result.calories).toBe(2000)
    expect(result.protein_g).toBe(130)
    expect(result.mealCount).toBe(0)
  })
})

describe('percentOfTarget', () => {
  it('returns a percentage and guards invalid targets', () => {
    expect(percentOfTarget(1500, 2000)).toBe(75)
    expect(percentOfTarget(10, 0)).toBeNull()
    expect(percentOfTarget(null, 2000)).toBeNull()
  })
})

describe('weeklyAverageWeight', () => {
  const entries = [
    { log_date: '2026-01-05', morning_weight_kg: 70, steps: 1, sleep_hours: 7, energy_rating: 3, face_skin_rating: 3 },
    { log_date: '2026-01-06', morning_weight_kg: 69.5, steps: 1, sleep_hours: 7, energy_rating: 3, face_skin_rating: 3 },
    { log_date: '2026-01-12', morning_weight_kg: 68, steps: 1, sleep_hours: 7, energy_rating: 3, face_skin_rating: 3 },
  ]

  it('averages only entries within the inclusive date range', () => {
    expect(weeklyAverageWeight(entries, '2026-01-05', '2026-01-11')).toBe(69.75)
  })

  it('ignores missing weights rather than counting them as zero', () => {
    const withMissing = [...entries, { log_date: '2026-01-07', morning_weight_kg: null, steps: 1, sleep_hours: 7, energy_rating: 3, face_skin_rating: 3 }]
    expect(weeklyAverageWeight(withMissing, '2026-01-05', '2026-01-11')).toBe(69.75)
  })

  it('returns null for an empty range', () => {
    expect(weeklyAverageWeight(entries, '2026-02-01', '2026-02-07')).toBeNull()
  })
})

describe('strengthProgression', () => {
  it('groups by date + exercise and takes the top set weight', () => {
    const points = strengthProgression([
      { date: '2026-01-05', exercise: 'Hip thrust', weight_kg: 60, reps: 10 },
      { date: '2026-01-05', exercise: 'Hip thrust', weight_kg: 70, reps: 8 },
      { date: '2026-01-05', exercise: 'Hip thrust', weight_kg: null, reps: 10 },
    ])
    expect(points).toHaveLength(1)
    expect(points[0].topWeight).toBe(70)
    expect(points[0].volume).toBe(60 * 10 + 70 * 8)
  })

  it('excludes sets without a weight', () => {
    expect(strengthProgression([{ date: '2026-01-05', exercise: 'Squat', weight_kg: null, reps: 10 }])).toHaveLength(0)
  })
})
