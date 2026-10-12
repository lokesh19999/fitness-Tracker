import * as XLSX from 'xlsx'
import { z } from 'zod'

export interface ExportPayload {
  daily_logs: Record<string, unknown>[]
  weekly_progress: Record<string, unknown>[]
  meal_entries: Record<string, unknown>[]
  body_measurements: Record<string, unknown>[]
  workout_sessions: Record<string, unknown>[]
  workout_exercises: Record<string, unknown>[]
  workout_sets: Record<string, unknown>[]
  roadmap_weeks: Record<string, unknown>[]
  fitness_settings: Record<string, unknown>[]
}

export type SheetName = keyof ExportPayload

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','))
  return lines.join('\n')
}

export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  downloadBlob(toCsv(rows), filename, 'text/csv;charset=utf-8;')
}

export function exportWorkbook(payload: ExportPayload, filename = 'goddess-physique-export.xlsx') {
  const wb = XLSX.utils.book_new()
  for (const [name, rows] of Object.entries(payload)) {
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ note: 'no data' }])
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  }
  XLSX.writeFile(wb, filename)
}

export function exportJsonBackup(payload: ExportPayload, filename = 'goddess-physique-backup.json') {
  const backup = { version: 1, exportedAt: new Date().toISOString(), data: payload }
  downloadBlob(JSON.stringify(backup, null, 2), filename, 'application/json')
}

const datesBackup = z.object({
  version: z.number(),
  exportedAt: z.string(),
  data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
})

export function parseJsonBackup(text: string): ExportPayload {
  const json: unknown = JSON.parse(text)
  const parsed = datesBackup.parse(json)
  return parsed.data as unknown as ExportPayload
}

export interface SheetPreview {
  name: string
  headers: string[]
  rows: Record<string, unknown>[]
  totalRows: number
}

export async function readWorkbook(file: File): Promise<{ sheetNames: string[]; sheets: Record<string, SheetPreview> }> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheets: Record<string, SheetPreview> = {}
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    sheets[name] = { name, headers, rows: rows.slice(0, 50), totalRows: rows.length }
  }
  return { sheetNames: wb.SheetNames, sheets }
}

export function readAllRows(file: File, sheetName: string): Promise<Record<string, unknown>[]> {
  return file.arrayBuffer().then((buffer) => {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], { defval: '' })
  })
}

/** Normalises a cell value into a YYYY-MM-DD string when possible. */
export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value).trim()
  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  if (!/[0-9]/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}