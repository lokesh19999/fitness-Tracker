import type { DailyLog } from '@/features/daily-log/api'
import type { BodyMeasurement } from '@/features/measurements/api'
import type { MealEntry } from '@/features/nutrition/api'
import type { FitnessSettings } from '@/features/settings/api'
import type { WeeklyProgress } from '@/features/weekly-progress/api'
import type { WorkoutSessionFull } from '@/features/workouts/api'
import {
  average,
  isValidNumber,
  percentOfTarget,
  resolveDailyNutrition,
  round,
  strengthProgression,
  waistChange,
  weightChange,
  workoutCompletion,
} from '@/utils/calculations'
import { parseISODate, startOfWeek, toISODate } from '@/utils/dates'

export interface DashboardInputs {
  logs: DailyLog[]
  meals: MealEntry[]
  sessions: WorkoutSessionFull[]
  measurements: BodyMeasurement[]
  weekly: WeeklyProgress[]
  settings: FitnessSettings
  weekNumber?: number
}

export interface DashboardMetrics {
  startingWeight: number | null
  latestWeight: number | null
  weightChange: number | null
  startingWaist: number | null
  latestWaist: number | null
  waistChange: number | null
  avgCalories: number | null
  avgProtein: number | null
  avgCarbs: number | null
  avgFat: number | null
  workoutCompletionPct: number | null
  workoutsCompleted: number
  workoutsPlanned: number
  avgSteps: number | null
  avgSleep: number | null
  avgEnergy: number | null
  avgFaceSkin: number | null
  caloriesTarget: number
  proteinTarget: number
}

export interface DashboardData {
  metrics: DashboardMetrics
  series: {
    weight: { date: string; weight: number | null }[]
    measurements: { date: string; waist: number | null; hip: number | null }[]
    calories: { date: string; calories: number | null; target: number }[]
    protein: { date: string; protein: number | null; target: number }[]
    stepsSleep: { date: string; steps: number | null; sleep: number | null }[]
    workoutByWeek: { week: string; completion: number | null }[]
    energyFace: { date: string; energy: number | null; faceSkin: number | null }[]
    strength: { exercise: string; points: { date: string; topWeight: number | null; volume: number | null }[] }[]
  }
}

function withinWeek(dateISO: string, weekStart: string): boolean {
  const start = startOfWeek(parseISODate(weekStart))
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return dateISO >= toISODate(start) && dateISO <= toISODate(end)
}

export function buildDashboard(inputs: DashboardInputs): DashboardData {
  const { logs, meals, sessions, measurements, settings } = inputs
  const ascLogs = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date))
  const ascMeasurements = [...measurements].sort((a, b) => a.measured_on.localeCompare(b.measured_on))

  const firstValid = <T>(rows: T[], pick: (r: T) => number | null): number | null => {
    for (const r of rows) {
      const v = pick(r)
      if (isValidNumber(v)) return v
    }
    return null
  }
  const lastValid = <T>(rows: T[], pick: (r: T) => number | null): number | null => {
    for (let i = rows.length - 1; i >= 0; i--) {
      const v = pick(rows[i])
      if (isValidNumber(v)) return v
    }
    return null
  }

  const startingWeight =
    settings.starting_weight_kg ?? firstValid(ascLogs, (l) => l.morning_weight_kg)
  const latestWeight =
    lastValid(ascLogs, (l) => l.morning_weight_kg) ??
    lastValid(ascMeasurements, (m) => m.weight_kg)
  const startingWaist =
    settings.starting_waist_cm ?? firstValid(ascMeasurements, (m) => m.waist_cm)
  const latestWaist =
    lastValid(ascMeasurements, (m) => m.waist_cm) ??
    lastValid([...inputs.weekly].sort((a, b) => a.week_number - b.week_number), (w) => w.waist_cm)

  // Nutrition per day: meal totals take precedence to avoid double counting.
  const mealsByDate = new Map<string, MealEntry[]>()
  for (const meal of meals) {
    if (!mealsByDate.has(meal.log_date)) mealsByDate.set(meal.log_date, [])
    mealsByDate.get(meal.log_date)!.push(meal)
  }
  const nutritionDates = Array.from(
    new Set([...ascLogs.map((l) => l.log_date), ...mealsByDate.keys()]),
  ).sort((a, b) => a.localeCompare(b))
  const nutritionByDate = new Map<string, ReturnType<typeof resolveDailyNutrition>>()
  for (const date of nutritionDates) {
    const dayMeals = mealsByDate.get(date) ?? []
    const log = ascLogs.find((l) => l.log_date === date)
    if (dayMeals.length > 0) {
      nutritionByDate.set(date, resolveDailyNutrition({ source: 'meals', meals: dayMeals }))
    } else if (log) {
      nutritionByDate.set(
        date,
        resolveDailyNutrition({
          source: 'manual',
          manual: {
            calories: log.calories,
            protein_g: log.protein_g,
            carbs_g: log.carbs_g,
            fat_g: log.fat_g,
            water_l: log.water_l,
          },
        }),
      )
    }
  }
  const dailyNutrition = Array.from(nutritionByDate.values())

  const workoutsCompleted = sessions.filter((s) => s.session.status === 'completed').length
  const workoutsPlanned = sessions.length

  const metrics: DashboardMetrics = {
    startingWeight,
    latestWeight,
    weightChange: weightChange(startingWeight, latestWeight),
    startingWaist,
    latestWaist,
    waistChange: waistChange(startingWaist, latestWaist),
    avgCalories: round(average(dailyNutrition.map((d) => d.calories)), 0),
    avgProtein: round(average(dailyNutrition.map((d) => d.protein_g)), 0),
    avgCarbs: round(average(dailyNutrition.map((d) => d.carbs_g)), 0),
    avgFat: round(average(dailyNutrition.map((d) => d.fat_g)), 0),
    workoutCompletionPct: workoutCompletion(workoutsCompleted, workoutsPlanned),
    workoutsCompleted,
    workoutsPlanned,
    avgSteps: round(average(ascLogs.map((l) => l.steps)), 0),
    avgSleep: round(average(ascLogs.map((l) => l.sleep_hours)), 1),
    avgEnergy: round(average(ascLogs.map((l) => l.energy_rating)), 1),
    avgFaceSkin: round(average(ascLogs.map((l) => l.face_skin_rating)), 1),
    caloriesTarget: settings.target_calories,
    proteinTarget: settings.target_protein_g,
  }

  // Charts -------------------------------------------------------------------
  const weight = ascLogs
    .filter((l) => isValidNumber(l.morning_weight_kg))
    .map((l) => ({ date: l.log_date, weight: l.morning_weight_kg }))

  const measurementSeries = ascMeasurements.map((m) => ({
    date: m.measured_on,
    waist: m.waist_cm,
    hip: m.hip_cm,
  }))

  const calories = nutritionDates.map((date) => ({
    date,
    calories: nutritionByDate.get(date)?.calories ?? null,
    target: settings.target_calories,
  }))

  const protein = nutritionDates.map((date) => ({
    date,
    protein: nutritionByDate.get(date)?.protein_g ?? null,
    target: settings.target_protein_g,
  }))

  const stepsSleep = ascLogs.map((l) => ({
    date: l.log_date,
    steps: l.steps,
    sleep: l.sleep_hours,
  }))

  const sessionsByWeek = new Map<number, WorkoutSessionFull[]>()
  for (const s of sessions) {
    const week = s.session.week_number
    if (week === null || week === undefined) continue
    if (!sessionsByWeek.has(week)) sessionsByWeek.set(week, [])
    sessionsByWeek.get(week)!.push(s)
  }
  const workoutByWeek = Array.from(sessionsByWeek.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([week, list]) => ({
      week: `W${week}`,
      completion: workoutCompletion(
        list.filter((s) => s.session.status === 'completed').length,
        list.length,
      ),
    }))

  const energyFace = ascLogs.map((l) => ({
    date: l.log_date,
    energy: l.energy_rating,
    faceSkin: l.face_skin_rating,
  }))

  const allSets = sessions.flatMap((s) =>
    s.exercises.flatMap((e) =>
      e.sets
        .filter((set) => isValidNumber(set.weight_kg))
        .map((set) => ({
          date: s.session.session_date,
          exercise: e.exercise_name,
          weight_kg: set.weight_kg,
          reps: set.reps,
        })),
    ),
  )
  const progression = strengthProgression(allSets)
  const byExercise = new Map<string, { date: string; topWeight: number | null; volume: number | null }[]>()
  for (const point of progression) {
    if (!byExercise.has(point.exercise)) byExercise.set(point.exercise, [])
    byExercise.get(point.exercise)!.push({ date: point.date, topWeight: point.topWeight, volume: point.volume })
  }
  const strength = Array.from(byExercise.entries()).map(([exercise, points]) => ({ exercise, points }))

  return {
    metrics,
    series: {
      weight,
      measurements: measurementSeries,
      calories,
      protein,
      stepsSleep,
      workoutByWeek,
      energyFace,
      strength,
    },
  }
}

export { percentOfTarget, withinWeek }