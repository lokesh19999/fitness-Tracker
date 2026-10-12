import { describe, expect, it } from 'vitest'

import {
  addDays,
  dateRangeForWeek,
  isoWeekNumber,
  parseISODate,
  programmeWeek,
  startOfWeek,
  toISODate,
} from './dates'

describe('toISODate / parseISODate', () => {
  it('round-trips a local date without timezone drift', () => {
    expect(toISODate(parseISODate('2026-03-09'))).toBe('2026-03-09')
  })
})

describe('startOfWeek', () => {
  it('returns Monday for a mid-week date', () => {
    // 2026-03-11 is a Wednesday
    expect(toISODate(startOfWeek(parseISODate('2026-03-11')))).toBe('2026-03-09')
  })

  it('returns the same day for a Monday', () => {
    expect(toISODate(startOfWeek(parseISODate('2026-03-09')))).toBe('2026-03-09')
  })

  it('treats Sunday as the end of the week (previous Monday)', () => {
    expect(toISODate(startOfWeek(parseISODate('2026-03-15')))).toBe('2026-03-09')
  })
})

describe('addDays', () => {
  it('adds days across month boundaries', () => {
    expect(toISODate(addDays(parseISODate('2026-01-30'), 3))).toBe('2026-02-02')
  })
})

describe('isoWeekNumber', () => {
  it('matches known ISO week numbers', () => {
    expect(isoWeekNumber(parseISODate('2026-01-01'))).toBe(1)
    expect(isoWeekNumber(parseISODate('2026-12-31'))).toBe(53)
  })
})

describe('programmeWeek', () => {
  it('is 1 during the start week and increments on Mondays', () => {
    expect(programmeWeek('2026-03-09', '2026-03-09')).toBe(1)
    expect(programmeWeek('2026-03-09', '2026-03-15')).toBe(1)
    expect(programmeWeek('2026-03-09', '2026-03-16')).toBe(2)
    expect(programmeWeek('2026-03-09', '2026-04-06')).toBe(5)
  })

  it('returns values below 1 before the programme starts', () => {
    expect(programmeWeek('2026-03-09', '2026-03-02')).toBe(0)
  })
})

describe('dateRangeForWeek', () => {
  it('spans Monday to Sunday inclusive', () => {
    expect(dateRangeForWeek('2026-03-09')).toEqual({ from: '2026-03-09', to: '2026-03-15' })
  })
})
