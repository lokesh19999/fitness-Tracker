/**
 * Date helpers. Weeks are Monday-based (ISO 8601) to match the training plan.
 */

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses a YYYY-MM-DD string as a local date (no timezone shifting). */
export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 = Sunday
  const diff = (day + 6) % 7 // days since Monday
  d.setDate(d.getDate() - diff)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** ISO week number (1-53). */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Programme week number (1-based) for a date relative to a programme start date.
 * Returns values < 1 for dates before the programme begins.
 */
export function programmeWeek(programmeStart: string, date: string): number {
  const start = startOfWeek(parseISODate(programmeStart))
  const target = startOfWeek(parseISODate(date))
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000)
  return Math.floor(diffDays / 7) + 1
}

export function dateRangeForWeek(weekStart: string): { from: string; to: string } {
  const start = parseISODate(weekStart)
  return { from: toISODate(start), to: toISODate(addDays(start, 6)) }
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? parseISODate(value) : value
  return date.toLocaleDateString(undefined, opts ?? { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}