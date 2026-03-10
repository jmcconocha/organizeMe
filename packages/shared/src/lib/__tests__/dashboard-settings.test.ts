import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDashboardSettings, updateDashboardSettings, resetDashboardSettings } from '../dashboard-settings'
import { DEFAULT_DASHBOARD_SETTINGS } from '../../types/dashboard-settings'

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

describe('dashboard-settings', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getDashboardSettings', () => {
    it('returns defaults when nothing stored', () => {
      const settings = getDashboardSettings()
      expect(settings).toEqual(DEFAULT_DASHBOARD_SETTINGS)
    })

    it('returns stored settings merged with defaults', () => {
      localStorageMock.setItem(
        'organize-me-dashboard-settings',
        JSON.stringify({ defaultView: 'table' })
      )
      const settings = getDashboardSettings()
      expect(settings.defaultView).toBe('table')
      expect(settings.cardDensity).toBe('comfortable') // default preserved
    })

    it('returns defaults for invalid JSON', () => {
      localStorageMock.setItem('organize-me-dashboard-settings', 'bad-json')
      expect(getDashboardSettings()).toEqual(DEFAULT_DASHBOARD_SETTINGS)
    })

    it('returns defaults for null stored value', () => {
      localStorageMock.setItem('organize-me-dashboard-settings', 'null')
      expect(getDashboardSettings()).toEqual(DEFAULT_DASHBOARD_SETTINGS)
    })
  })

  describe('updateDashboardSettings', () => {
    it('updates a single field', () => {
      const result = updateDashboardSettings({ defaultView: 'table' })
      expect(result.defaultView).toBe('table')
      expect(result.cardDensity).toBe('comfortable')
    })

    it('updates multiple fields', () => {
      const result = updateDashboardSettings({
        defaultView: 'table',
        cardDensity: 'compact',
      })
      expect(result.defaultView).toBe('table')
      expect(result.cardDensity).toBe('compact')
    })

    it('persists to localStorage', () => {
      updateDashboardSettings({ defaultView: 'table' })
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const stored = JSON.parse(localStorageMock.setItem.mock.calls.at(-1)![1])
      expect(stored.defaultView).toBe('table')
    })
  })

  describe('resetDashboardSettings', () => {
    it('resets to defaults', () => {
      updateDashboardSettings({ defaultView: 'table', cardDensity: 'compact' })
      const result = resetDashboardSettings()
      expect(result).toEqual(DEFAULT_DASHBOARD_SETTINGS)
    })
  })
})
