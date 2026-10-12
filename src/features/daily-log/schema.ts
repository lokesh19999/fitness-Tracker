import { z } from 'zod'

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} must be between ${min} and ${max}`,
    )

const optionalInt = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (/^-?\d+$/.test(v) && Number(v) >= min && Number(v) <= max),
      `${label} must be a whole number between ${min} and ${max}`,
    )

export const dailyLogSchema = z.object({
  log_date: z.string().min(1, 'Date is required'),
  day_name: z.string().optional(),
  morning_weight_kg: optionalNumber(20, 400, 'Weight'),
  calories: optionalNumber(0, 10000, 'Calories'),
  protein_g: optionalNumber(0, 1000, 'Protein'),
  carbs_g: optionalNumber(0, 1000, 'Carbs'),
  fat_g: optionalNumber(0, 1000, 'Fat'),
  steps: optionalInt(0, 100000, 'Steps'),
  workout_completed: z.boolean(),
  water_l: optionalNumber(0, 20, 'Water'),
  sleep_hours: optionalNumber(0, 24, 'Sleep'),
  energy_rating: optionalInt(1, 5, 'Energy rating'),
  face_skin_rating: optionalInt(1, 5, 'Face/skin rating'),
  notes: z.string().optional(),
})

export type DailyLogValues = z.infer<typeof dailyLogSchema>

/** Turns empty-string numeric inputs into null for persistence. */
export function normalizeDailyLog(values: DailyLogValues) {
  const n = (v: string | undefined) => (v === '' || v === undefined ? null : Number(v))
  return {
    log_date: values.log_date,
    day_name: values.day_name || null,
    morning_weight_kg: n(values.morning_weight_kg),
    calories: n(values.calories),
    protein_g: n(values.protein_g),
    carbs_g: n(values.carbs_g),
    fat_g: n(values.fat_g),
    steps: n(values.steps),
    workout_completed: values.workout_completed,
    water_l: n(values.water_l),
    sleep_hours: n(values.sleep_hours),
    energy_rating: n(values.energy_rating),
    face_skin_rating: n(values.face_skin_rating),
    notes: values.notes || null,
  }
}