import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getFavorites, toggleFavorite, isFavorite } from '../favorites'

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

describe('favorites', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getFavorites', () => {
    it('returns empty set when nothing stored', () => {
      const favorites = getFavorites()
      expect(favorites.size).toBe(0)
    })

    it('returns stored favorites', () => {
      localStorageMock.setItem('organize-me-favorites', JSON.stringify(['p1', 'p2']))
      const favorites = getFavorites()
      expect(favorites.size).toBe(2)
      expect(favorites.has('p1')).toBe(true)
      expect(favorites.has('p2')).toBe(true)
    })

    it('returns empty set for invalid JSON', () => {
      localStorageMock.setItem('organize-me-favorites', 'not-json')
      const favorites = getFavorites()
      expect(favorites.size).toBe(0)
    })

    it('returns empty set for non-array JSON', () => {
      localStorageMock.setItem('organize-me-favorites', JSON.stringify({ a: 1 }))
      const favorites = getFavorites()
      expect(favorites.size).toBe(0)
    })
  })

  describe('toggleFavorite', () => {
    it('adds a project to favorites', () => {
      const result = toggleFavorite('project-1')
      expect(result.has('project-1')).toBe(true)
    })

    it('removes a project from favorites on second toggle', () => {
      toggleFavorite('project-1')
      const result = toggleFavorite('project-1')
      expect(result.has('project-1')).toBe(false)
    })

    it('persists to localStorage', () => {
      toggleFavorite('project-1')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'organize-me-favorites',
        JSON.stringify(['project-1'])
      )
    })
  })

  describe('isFavorite', () => {
    it('returns false for non-favorite', () => {
      expect(isFavorite('project-1')).toBe(false)
    })

    it('returns true for favorite', () => {
      toggleFavorite('project-1')
      expect(isFavorite('project-1')).toBe(true)
    })
  })
})
