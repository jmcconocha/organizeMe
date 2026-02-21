/**
 * Favorites Management Module
 *
 * This module provides utility functions for managing favorite projects
 * using browser localStorage. Favorites are stored as a Set of project IDs
 * for efficient O(1) lookup operations.
 */

/**
 * LocalStorage key for storing favorite project IDs.
 */
const FAVORITES_STORAGE_KEY = 'organize-me-favorites'

/**
 * Retrieves the set of favorite project IDs from localStorage.
 *
 * This function safely handles:
 * - Missing localStorage (SSR environments)
 * - Invalid/corrupted localStorage data
 * - Empty favorites list
 *
 * @returns Set of project IDs that have been marked as favorites
 *
 * @example
 * ```ts
 * const favorites = getFavorites()
 * console.log(`User has ${favorites.size} favorite projects`)
 * ```
 */
export function getFavorites(): Set<string> {
  // Handle SSR/environments without localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return new Set()
  }

  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!stored) {
      return new Set()
    }

    // Parse stored JSON array and convert to Set
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return new Set(parsed)
    }

    // Handle invalid data format
    return new Set()
  } catch (error) {
    // Handle JSON parse errors or other issues
    console.error('Failed to load favorites from localStorage:', error)
    return new Set()
  }
}

/**
 * Saves the favorites Set to localStorage.
 *
 * @param favorites - Set of project IDs to persist
 */
function saveFavorites(favorites: Set<string>): void {
  // Handle SSR/environments without localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    // Convert Set to Array for JSON serialization
    const array = Array.from(favorites)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(array))
  } catch (error) {
    // Handle storage quota errors or other issues
    console.error('Failed to save favorites to localStorage:', error)
  }
}

/**
 * Toggles the favorite status of a project.
 *
 * If the project is currently a favorite, it will be removed.
 * If the project is not a favorite, it will be added.
 *
 * @param projectId - The ID of the project to toggle
 * @returns The updated Set of favorite project IDs
 *
 * @example
 * ```ts
 * // Add a project to favorites
 * const favorites = toggleFavorite('my-awesome-project')
 *
 * // Click again to remove from favorites
 * const updated = toggleFavorite('my-awesome-project')
 * ```
 */
export function toggleFavorite(projectId: string): Set<string> {
  const favorites = getFavorites()

  if (favorites.has(projectId)) {
    favorites.delete(projectId)
  } else {
    favorites.add(projectId)
  }

  saveFavorites(favorites)
  return favorites
}

/**
 * Checks if a project is marked as a favorite.
 *
 * This is a convenience function that provides O(1) lookup
 * to determine favorite status.
 *
 * @param projectId - The ID of the project to check
 * @returns true if the project is a favorite, false otherwise
 *
 * @example
 * ```ts
 * if (isFavorite('my-project')) {
 *   console.log('This project is a favorite!')
 * }
 * ```
 */
export function isFavorite(projectId: string): boolean {
  const favorites = getFavorites()
  return favorites.has(projectId)
}
