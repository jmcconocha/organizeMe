/**
 * Project Cache Module
 *
 * In-memory cache for project scan results to avoid re-scanning on every page load.
 * Supports TTL-based expiration and manual invalidation.
 */

import type { Project } from '@organizeme/shared/types/project'

interface CacheEntry {
  projects: Project[]
  timestamp: number
}

/** Default TTL: 5 minutes */
const DEFAULT_TTL_MS = 5 * 60 * 1000

let cache: CacheEntry | null = null

/**
 * Gets cached projects if available and not expired.
 *
 * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
 * @returns Cached projects or null if cache is empty/expired
 */
export function getCachedProjects(ttlMs: number = DEFAULT_TTL_MS): Project[] | null {
  if (!cache) return null

  const age = Date.now() - cache.timestamp
  if (age > ttlMs) {
    cache = null
    return null
  }

  return cache.projects
}

/**
 * Stores projects in the cache.
 */
export function setCachedProjects(projects: Project[]): void {
  cache = {
    projects,
    timestamp: Date.now(),
  }
}

/**
 * Invalidates the cache, forcing a fresh scan on next load.
 */
export function invalidateCache(): void {
  cache = null
}

/**
 * Returns the age of the cache in milliseconds, or null if no cache.
 */
export function getCacheAge(): number | null {
  if (!cache) return null
  return Date.now() - cache.timestamp
}

/**
 * Returns whether the cache is currently valid.
 */
export function isCacheValid(ttlMs: number = DEFAULT_TTL_MS): boolean {
  return getCachedProjects(ttlMs) !== null
}
