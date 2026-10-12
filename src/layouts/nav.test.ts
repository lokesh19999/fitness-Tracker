import { describe, expect, it } from 'vitest'

import { MORE_ITEMS, NAV_ITEMS, PRIMARY_ITEMS } from './nav'

describe('navigation config', () => {
  it('keeps unique paths', () => {
    const paths = NAV_ITEMS.map((i) => i.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('exactly fills the five-column mobile bar (guards against horizontal overflow)', () => {
    expect(PRIMARY_ITEMS).toHaveLength(5)
  })

  it('splits primary and secondary items without overlap', () => {
    expect(PRIMARY_ITEMS.length + MORE_ITEMS.length).toBe(NAV_ITEMS.length)
    const primaryPaths = new Set(PRIMARY_ITEMS.map((i) => i.path))
    expect(MORE_ITEMS.some((i) => primaryPaths.has(i.path))).toBe(false)
  })

  it('provides a short label for every item', () => {
    for (const item of NAV_ITEMS) {
      expect(item.shortLabel.length).toBeGreaterThan(0)
    }
  })
})
