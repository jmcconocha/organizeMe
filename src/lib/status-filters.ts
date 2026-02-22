/**
 * Status Filters Management Module
 *
 * This module provides utility functions for managing status filter selections
 * using browser localStorage. Filters are stored as a Set of ProjectStatus values
 * for efficient O(1) lookup operations.
 */

import type { ProjectStatus } from "@/types/project"

/**
 * LocalStorage key for storing selected status filters.
 */
const STATUS_FILTERS_STORAGE_KEY = 'organize-me-status-filters'

/**
 * Retrieves the set of selected status filters from localStorage.
 *
 * This function safely handles:
 * - Missing localStorage (SSR environments)
 * - Invalid/corrupted localStorage data
 * - Empty filter selections
 *
 * @returns Set of ProjectStatus values that are currently selected as filters
 *
 * @example
 * ```ts
 * const filters = getStatusFilters()
 * console.log(`User has ${filters.size} active status filters`)
 * ```
 */
export function getStatusFilters(): Set<ProjectStatus> {
  // Handle SSR/environments without localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return new Set()
  }

  try {
    const stored = localStorage.getItem(STATUS_FILTERS_STORAGE_KEY)
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
    console.error('Failed to load status filters from localStorage:', error)
    return new Set()
  }
}

/**
 * Saves the status filters Set to localStorage.
 *
 * @param filters - Set of ProjectStatus values to persist
 */
function saveStatusFilters(filters: Set<ProjectStatus>): void {
  // Handle SSR/environments without localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    // Convert Set to Array for JSON serialization
    const array = Array.from(filters)
    localStorage.setItem(STATUS_FILTERS_STORAGE_KEY, JSON.stringify(array))
  } catch (error) {
    // Handle storage quota errors or other issues
    console.error('Failed to save status filters to localStorage:', error)
  }
}

/**
 * Toggles a status filter's selection state.
 *
 * If the status is currently selected, it will be removed.
 * If the status is not selected, it will be added.
 *
 * @param status - The ProjectStatus to toggle
 * @returns The updated Set of selected status filters
 *
 * @example
 * ```ts
 * // Add 'dirty' to selected filters
 * const filters = toggleStatusFilter('dirty')
 *
 * // Click again to remove 'dirty' from filters
 * const updated = toggleStatusFilter('dirty')
 * ```
 */
export function toggleStatusFilter(status: ProjectStatus): Set<ProjectStatus> {
  const filters = getStatusFilters()

  if (filters.has(status)) {
    filters.delete(status)
  } else {
    filters.add(status)
  }

  saveStatusFilters(filters)
  return filters
}

/**
 * Clears all selected status filters.
 *
 * @returns An empty Set
 *
 * @example
 * ```ts
 * clearStatusFilters()
 * ```
 */
export function clearStatusFilters(): Set<ProjectStatus> {
  const emptySet = new Set<ProjectStatus>()
  saveStatusFilters(emptySet)
  return emptySet
}

/**
 * Checks if a status is currently selected as a filter.
 *
 * This is a convenience function that provides O(1) lookup
 * to determine if a status is active in the filter.
 *
 * @param status - The ProjectStatus to check
 * @returns true if the status is selected, false otherwise
 *
 * @example
 * ```ts
 * if (isStatusFilterActive('dirty')) {
 *   console.log('Filtering by dirty status!')
 * }
 * ```
 */
export function isStatusFilterActive(status: ProjectStatus): boolean {
  const filters = getStatusFilters()
  return filters.has(status)
}
