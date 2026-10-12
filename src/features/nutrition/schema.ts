import { z } from 'zod'

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max),
      `${label} must be between ${min} and ${max}`,
    )

export const mealSchema = z.object({
  log_date: z.string().min(1, 'Date is required'),
  meal_type: z.string().min(1, 'Meal is required'),
  food: z.string().min(1, 'Describe the food'),
  portion: z.string().optional(),
  calories: optionalNumber(0, 10000, 'Calories'),
  protein_g: optionalNumber(0, 1000, 'Protein'),
  carbs_g: optionalNumber(0, 1000, 'Carbs'),
  fat_g: optionalNumber(0, 1000, 'Fat'),
  water_l: optionalNumber(0, 20, 'Water'),
  notes: z.string().optional(),
})

export type MealValues = z.infer<typeof mealSchema>

export function normalizeMeal(values: MealValues) {
  const n = (v: string | undefined) => (v === '' || v === undefined ? null : Number(v))
  return {
    log_date: values.log_date,
    meal_type: values.meal_type,
    food: values.food,
    portion: values.portion || null,
    calories: n(values.calories),
    protein_g: n(values.protein_g),
    carbs_g: n(values.carbs_g),
    fat_g: n(values.fat_g),
    water_l: n(values.water_l),
    notes: values.notes || null,
  }
}