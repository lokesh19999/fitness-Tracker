import type { DailyLog } from '@/features/daily-log/api'
import type { FitnessSettings } from '@/features/settings/api'
import type { WeeklyProgress } from '@/features/weekly-progress/api'
import type { WorkoutSessionFull } from '@/features/workouts/api'
import { average, nutritionAdherence, round, workoutCompletion } from '@/utils/calculations'
import { dateRangeForWeek, parseISODate, startOfWeek, toISODate } from '@/utils/dates'

export interface WeekComputed {
  weekNumber: number
  weekStart: string
  weekEnd: string
  avgWeight: number | null
  avgSteps: number | null
  avgSleep: number | null
  workoutsCompleted: number
  workoutsPlanned: number
  completionPct: number | null
  nutritionAdherencePct: number | null
  daysWithData: number
}

export function weekStartFor(programmeStart: string, weekNumber: number): string {
  const start = startOfWeek(parseISODate(programmeStart))
  start.setDate(start.getDate() + (weekNumber - 1) * 7)
  return toISODate(start)
}

export function computeWeek(
  weekNumber: number,
  programmeStart: string,
  logs: DailyLog[],
  sessions: WorkoutSessionFull[],
  settings: FitnessSettings,
): WeekComputed {
  const weekStart = weekStartFor(programmeStart, weekNumber)
  const { from, to } = dateRangeForWeek(weekStart)
  const weekLogs = logs.filter((l) => l.log_date >= from && l.log_date <= to)
  const weekSessions = sessions.filter((s) => s.session.session_date >= from && s.session.session_date <= to)

  const completed = weekSessions.filter((s) => s.session.status === 'completed').length

  let eligible = 0
  let sufficient = 0
  for (const log of weekLogs) {
    const hasCalories = typeof log.calories === 'number'
    const hasProtein = typeof log.protein_g === 'number'
    if (!hasCalories && !hasProtein) continue
    sufficient += 1
    const calorieOk = hasCalories
      ? log.calories! >= settings.target_calories * 0.9 && log.calories! <= settings.target_calories * 1.1
      : false
    const proteinOk = hasProtein ? log.protein_g! >= settings.target_protein_g * 0.9 : false
    if (calorieOk || proteinOk) eligible += 1
  }

  return {
    weekNumber,
    weekStart,
    weekEnd: to,
    avgWeight: round(average(weekLogs.map((l) => l.morning_weight_kg)), 2),
    avgSteps: round(average(weekLogs.map((l) => l.steps)), 0),
    avgSleep: round(average(weekLogs.map((l) => l.sleep_hours)), 1),
    workoutsCompleted: completed,
    workoutsPlanned: weekSessions.length,
    completionPct: workoutCompletion(completed, weekSessions.length),
    nutritionAdherencePct: nutritionAdherence(eligible, sufficient),
    daysWithData: sufficient,
  }
}

export function mergeWeekly(computed: WeekComputed, manual: WeeklyProgress | undefined) {
  const isManual = (field: string) => manual?.manual_fields?.includes(field) ?? false
  return {
    weekNumber: computed.weekNumber,
    weekStart: manual?.week_start ?? computed.weekStart,
    weekEnd: computed.weekEnd,
    avgWeight: isManual('avg_weight_kg') ? manual?.avg_weight_kg ?? computed.avgWeight : computed.avgWeight,
    waist: manual?.waist_cm ?? null,
    hip: manual?.hip_cm ?? null,
    hipThrust: manual?.hip_thrust_kg ?? null,
    coreBenchmark: manual?.core_benchmark ?? null,
    avgSteps: isManual('avg_daily_steps') ? manual?.avg_daily_steps ?? computed.avgSteps : computed.avgSteps,
    workoutsCompleted: computed.workoutsCompleted,
    workoutsPlanned: computed.workoutsPlanned,
    completionPct: computed.completionPct,
    nutritionAdherencePct:
      isManual('nutrition_adherence_pct')
        ? manual?.nutrition_adherence_pct ?? computed.nutritionAdherencePct
        : computed.nutritionAdherencePct,
    avgSleep: isManual('avg_sleep_hours') ? manual?.avg_sleep_hours ?? computed.avgSleep : computed.avgSleep,
    energyFace: manual?.energy_face_rating ?? null,
    notes: manual?.notes ?? null,
    manualRow: manual ?? null,
    computed,
  }
}