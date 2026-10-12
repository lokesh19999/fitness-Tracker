import { describe, expect, it } from 'vitest'

import { normalizeDate, normalizeNumber, parseJsonBackup, toCsv } from './export-import'

describe('toCsv', () => {
  it('writes a header row and escapes commas, quotes and newlines', () => {
    const csv = toCsv([
      { date: '2026-01-01', note: 'said "hi"', food: 'rice, beans' },
      { date: '2026-01-02', note: 'plain', food: 'eggs' },
    ])
    expect(csv.split('\n')[0]).toBe('date,note,food')
    expect(csv).toContain('"said ""hi"""')
    expect(csv).toContain('"rice, beans"')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})

describe('normalizeDate', () => {
  it('returns YYYY-MM-DD for dates and parseable strings', () => {
    expect(normalizeDate(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05')
    expect(normalizeDate('2026-01-05')).toBe('2026-01-05')
  })

  it('returns null for empty or unparseable values', () => {
    expect(normalizeDate('')).toBeNull()
    expect(normalizeDate(null)).toBeNull()
    expect(normalizeDate('not-a-date')).toBeNull()
  })
})

describe('normalizeNumber', () => {
  it('parses numbers and strips units', () => {
    expect(normalizeNumber(70.5)).toBe(70.5)
    expect(normalizeNumber('70.5 kg')).toBe(70.5)
    expect(normalizeNumber('1,250')).toBe(1250)
  })

  it('returns null for empty or non-numeric values', () => {
    expect(normalizeNumber('')).toBeNull()
    expect(normalizeNumber('abc')).toBeNull()
    expect(normalizeNumber(undefined)).toBeNull()
  })
})

describe('parseJsonBackup', () => {
  it('round-trips the exported backup shape', () => {
    const backup = {
      version: 1,
      exportedAt: '2026-01-05T00:00:00.000Z',
      data: {
        daily_logs: [{ log_date: '2026-01-05', calories: 2000 }],
        meal_entries: [],
      },
    }
    const payload = parseJsonBackup(JSON.stringify(backup))
    expect(payload.daily_logs).toHaveLength(1)
    expect(payload.daily_logs[0]).toMatchObject({ calories: 2000 })
  })

  it('rejects malformed backups', () => {
    expect(() => parseJsonBackup('{"nope": true}')).toThrow()
    expect(() => parseJsonBackup('not json')).toThrow()
  })
})
