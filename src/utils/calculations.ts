/**
 * Fitness analytics calculations.
 *
 * Rules enforced here (see project spec §13):
 *  - Missing values are EXCLUDED from averages; they are never treated as zero.
 *  - Nutrition totals never double count meal-level and manual daily totals.
 *  - Completion / adherence are only computed from real recorded data.
 */

export type Nullable = number | null | undefined

export function isValidNumber(value: Nullable): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Average of valid entries, or null when there is no valid data. */
export function average(values: Nullable[]): number | null {
  const valid = values.filter(isValidNumber)
  if (valid.length === 0) return null
  return valid.reduce((sum, v) => sum + v, 0) / valid.length
}

export function sum(values: Nullable[]): number | null {
  const valid = values.filter(isValidNumber)
  if (valid.length === 0) return null
  return valid.reduce((acc, v) => acc + v, 0)
}

export function round(value: number | null, digits = 1): number | null {
  if (value === null) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** latest valid weight − starting weight. Positive means gained. */
export function weightChange(startingWeight: Nullable, latestWeight: Nullable): number | null {
  if (!isValidNumber(startingWeight) || !isValidNumber(latestWeight)) return null
  return round(latestWeight - startingWeight, 2)
}

export function waistChange(startingWaist: Nullable, latestWaist: Nullable): number | null {
  if (!isValidNumber(startingWaist) || !isValidNumber(latestWaist)) return null
  return round(latestWaist - startingWaist, 2)
}

/**
 * Workout completion = completed planned workouts / planned workouts * 100.
 * Returns null when there are no planned workouts in the period.
 */
export function workoutCompletion(completed: number, planned: number): number | null {
  if (!Number.isFinite(planned) || planned <= 0) return null
  const pct = (completed / planned) * 100
  return round(Math.min(100, Math.max(0, pct)), 1)
}

/**
 * Nutrition adherence = eligible days / days with sufficient data * 100.
 * Returns null when there are no days with sufficient data.
 */
export function nutritionAdherence(eligibleDays: number, daysWithData: number): number | null {
  if (!Number.isFinite(daysWithData) || daysWithData <= 0) return null
  const pct = (eligibleDays / daysWithData) * 100
  return round(Math.min(100, Math.max(0, pct)), 1)
}

export interface MealLike {
  calories: Nullable
  protein_g: Nullable
  carbs_g: Nullable
  fat_g: Nullable
  water_l: Nullable
}

export interface NutritionTotals {
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  water_l: number | null
  mealCount: number
}

/** Totals from meal-level entries. Missing macros are skipped, not zeroed. */
export function mealTotals(meals: MealLike[]): NutritionTotals {
  return {
    calories: sum(meals.map((m) => m.calories)),
    protein_g: sum(meals.map((m) => m.protein_g)),
    carbs_g: sum(meals.map((m) => m.carbs_g)),
    fat_g: sum(meals.map((m) => m.fat_g)),
    water_l: sum(meals.map((m) => m.water_l)),
    mealCount: meals.length,
  }
}

export type NutritionSource = 'meals' | 'manual'

export interface DailyNutritionInput {
  /** Which source is authoritative for the day to avoid double counting. */
  source: NutritionSource
  /** Meal-level entries (used when source === 'meals'). */
  meals?: MealLike[]
  /** Manual daily totals (used when source === 'manual'). */
  manual?: Partial<NutritionTotals>
}

/**
 * Resolves a single day's nutrition totals from exactly one source,
 * preventing meal totals and manual totals from being summed together.
 */
export function resolveDailyNutrition(input: DailyNutritionInput): NutritionTotals {
  if (input.source === 'manual') {
    return {
      calories: input.manual?.calories ?? null,
      protein_g: input.manual?.protein_g ?? null,
      carbs_g: input.manual?.carbs_g ?? null,
      fat_g: input.manual?.fat_g ?? null,
      water_l: input.manual?.water_l ?? null,
      mealCount: 0,
    }
  }
  return mealTotals(input.meals ?? [])
}

/** Percentage of a target consumed. Returns null when target is not a positive number. */
export function percentOfTarget(actual: Nullable, target: Nullable): number | null {
  if (!isValidNumber(actual) || !isValidNumber(target) || target <= 0) return null
  return round((actual / target) * 100, 1)
}

export interface DailyLike {
  log_date: string
  morning_weight_kg: Nullable
  waist_cm?: Nullable
  steps: Nullable
  sleep_hours: Nullable
  energy_rating: Nullable
  face_skin_rating: Nullable
  workout_completed?: boolean
}

/** Weekly average weight from daily entries whose date is within [from, to]. */
export function weeklyAverageWeight(
  entries: DailyLike[],
  from: string,
  to: string,
): number | null {
  const inRange = entries.filter((e) => e.log_date >= from && e.log_date <= to)
  return round(average(inRange.map((e) => e.morning_weight_kg)), 2)
}

export interface StrengthPoint {
  date: string
  exercise: string
  topWeight: number | null
  volume: number | null
}

/**
 * Strength progression: for each session date/exercise, the top set weight
 * and total volume (weight × reps). Missing set values are excluded.
 */
export function strengthProgression(
  sets: { date: string; exercise: string; weight_kg: Nullable; reps: Nullable }[],
): StrengthPoint[] {
  const groups = new Map<string, { weight: number[]; volume: number }>()
  for (const s of sets) {
    if (!isValidNumber(s.weight_kg)) continue
    const key = `${s.date}::${s.exercise}`
    const entry = groups.get(key) ?? { weight: [], volume: 0 }
    entry.weight.push(s.weight_kg)
    if (isValidNumber(s.reps)) entry.volume += s.weight_kg * s.reps
    groups.set(key, entry)
  }
  return Array.from(groups.entries())
    .map(([key, v]) => {
      const [date, exercise] = key.split('::')
      return {
        date,
        exercise,
        topWeight: Math.max(...v.weight),
        volume: round(v.volume, 1),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}