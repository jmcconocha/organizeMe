import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getArchivedProjects, toggleArchive, isArchived } from '../archive'

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

describe('archive', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getArchivedProjects', () => {
    it('returns empty set when nothing stored', () => {
      expect(getArchivedProjects().size).toBe(0)
    })

    it('returns stored archived projects', () => {
      localStorageMock.setItem('organize-me-archived', JSON.stringify(['p1', 'p2']))
      const archived = getArchivedProjects()
      expect(archived.has('p1')).toBe(true)
      expect(archived.has('p2')).toBe(true)
    })

    it('handles invalid JSON gracefully', () => {
      localStorageMock.setItem('organize-me-archived', '{bad}')
      expect(getArchivedProjects().size).toBe(0)
    })
  })

  describe('toggleArchive', () => {
    it('archives a project', () => {
      const result = toggleArchive('p1')
      expect(result.has('p1')).toBe(true)
    })

    it('unarchives on second toggle', () => {
      toggleArchive('p1')
      const result = toggleArchive('p1')
      expect(result.has('p1')).toBe(false)
    })
  })

  describe('isArchived', () => {
    it('returns false for non-archived', () => {
      expect(isArchived('p1')).toBe(false)
    })

    it('returns true for archived', () => {
      toggleArchive('p1')
      expect(isArchived('p1')).toBe(true)
    })
  })
})
