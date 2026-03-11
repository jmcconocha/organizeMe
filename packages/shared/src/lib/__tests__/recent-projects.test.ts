import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRecentProjects,
  trackProjectView,
  clearRecentProjects,
} from '../recent-projects'

// Mock localStorage
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

describe('recent-projects', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getRecentProjects', () => {
    it('returns empty array when nothing stored', () => {
      expect(getRecentProjects()).toEqual([])
    })

    it('returns stored entries', () => {
      const entries = [{ id: 'p1', viewedAt: 1000 }]
      localStorageMock.setItem('organize-me-recent-projects', JSON.stringify(entries))
      expect(getRecentProjects()).toEqual(entries)
    })

    it('returns empty array for invalid JSON', () => {
      localStorageMock.setItem('organize-me-recent-projects', 'bad')
      expect(getRecentProjects()).toEqual([])
    })

    it('returns empty array for non-array JSON', () => {
      localStorageMock.setItem('organize-me-recent-projects', JSON.stringify({ a: 1 }))
      expect(getRecentProjects()).toEqual([])
    })
  })

  describe('trackProjectView', () => {
    it('adds a project as most recent', () => {
      const result = trackProjectView('p1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('p1')
    })

    it('moves existing project to front', () => {
      trackProjectView('p1')
      trackProjectView('p2')
      const result = trackProjectView('p1')
      expect(result[0].id).toBe('p1')
      expect(result[1].id).toBe('p2')
    })

    it('limits to 10 entries', () => {
      for (let i = 0; i < 12; i++) {
        trackProjectView(`p${i}`)
      }
      const result = getRecentProjects()
      expect(result).toHaveLength(10)
      // Most recent should be p11
      expect(result[0].id).toBe('p11')
    })

    it('persists to localStorage', () => {
      trackProjectView('p1')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'organize-me-recent-projects',
        expect.any(String)
      )
    })
  })

  describe('clearRecentProjects', () => {
    it('removes the storage key', () => {
      trackProjectView('p1')
      clearRecentProjects()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('organize-me-recent-projects')
    })
  })
})
