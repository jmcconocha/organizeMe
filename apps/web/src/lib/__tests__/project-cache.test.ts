import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedProjects,
  setCachedProjects,
  invalidateCache,
  getCacheAge,
  isCacheValid,
} from '../project-cache'
import type { Project } from '@organizeme/shared/types/project'

function makeProject(name: string): Project {
  return {
    id: name.toLowerCase(),
    name,
    path: `/projects/${name}`,
    status: 'active',
    lastModified: new Date('2025-01-15'),
    hasPackageJson: true,
    hasReadme: true,
  }
}

describe('project-cache', () => {
  beforeEach(() => {
    invalidateCache()
  })

  describe('getCachedProjects', () => {
    it('returns null when cache is empty', () => {
      expect(getCachedProjects()).toBeNull()
    })

    it('returns cached projects after setCachedProjects', () => {
      const projects = [makeProject('Alpha'), makeProject('Beta')]
      setCachedProjects(projects)
      const cached = getCachedProjects()
      expect(cached).toHaveLength(2)
      expect(cached![0].name).toBe('Alpha')
    })

    it('returns null after cache expires', () => {
      const projects = [makeProject('Alpha')]
      setCachedProjects(projects)
      // Use a negative TTL to simulate expiration
      expect(getCachedProjects(-1)).toBeNull()
    })

    it('returns projects when within TTL', () => {
      const projects = [makeProject('Alpha')]
      setCachedProjects(projects)
      // 10 second TTL should be fine
      expect(getCachedProjects(10000)).not.toBeNull()
    })
  })

  describe('invalidateCache', () => {
    it('clears the cache', () => {
      setCachedProjects([makeProject('Alpha')])
      expect(getCachedProjects()).not.toBeNull()
      invalidateCache()
      expect(getCachedProjects()).toBeNull()
    })
  })

  describe('getCacheAge', () => {
    it('returns null when no cache', () => {
      expect(getCacheAge()).toBeNull()
    })

    it('returns age in milliseconds', () => {
      setCachedProjects([makeProject('Alpha')])
      const age = getCacheAge()
      expect(age).not.toBeNull()
      expect(age!).toBeGreaterThanOrEqual(0)
      expect(age!).toBeLessThan(1000) // should be very recent
    })
  })

  describe('isCacheValid', () => {
    it('returns false when no cache', () => {
      expect(isCacheValid()).toBe(false)
    })

    it('returns true with valid cache', () => {
      setCachedProjects([makeProject('Alpha')])
      expect(isCacheValid()).toBe(true)
    })

    it('returns false with expired cache', () => {
      setCachedProjects([makeProject('Alpha')])
      expect(isCacheValid(-1)).toBe(false)
    })
  })
})
