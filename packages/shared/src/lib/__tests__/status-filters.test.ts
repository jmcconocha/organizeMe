import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStatusFilters, toggleStatusFilter, clearStatusFilters, isStatusFilterActive } from '../status-filters'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
})
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('status-filters', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getStatusFilters', () => {
    it('returns empty set initially', () => {
      expect(getStatusFilters().size).toBe(0)
    })

    it('returns stored filters', () => {
      localStorageMock.setItem('organize-me-status-filters', JSON.stringify(['dirty', 'active']))
      const filters = getStatusFilters()
      expect(filters.has('dirty')).toBe(true)
      expect(filters.has('active')).toBe(true)
      expect(filters.size).toBe(2)
    })

    it('handles corrupted data', () => {
      localStorageMock.setItem('organize-me-status-filters', 'invalid')
      expect(getStatusFilters().size).toBe(0)
    })
  })

  describe('toggleStatusFilter', () => {
    it('adds a filter', () => {
      const result = toggleStatusFilter('dirty')
      expect(result.has('dirty')).toBe(true)
    })

    it('removes on second toggle', () => {
      toggleStatusFilter('dirty')
      const result = toggleStatusFilter('dirty')
      expect(result.has('dirty')).toBe(false)
    })

    it('supports multiple filters', () => {
      toggleStatusFilter('dirty')
      const result = toggleStatusFilter('active')
      expect(result.has('dirty')).toBe(true)
      expect(result.has('active')).toBe(true)
    })
  })

  describe('clearStatusFilters', () => {
    it('clears all filters', () => {
      toggleStatusFilter('dirty')
      toggleStatusFilter('active')
      const result = clearStatusFilters()
      expect(result.size).toBe(0)
    })
  })

  describe('isStatusFilterActive', () => {
    it('returns false when not active', () => {
      expect(isStatusFilterActive('dirty')).toBe(false)
    })

    it('returns true when active', () => {
      toggleStatusFilter('dirty')
      expect(isStatusFilterActive('dirty')).toBe(true)
    })
  })
})
