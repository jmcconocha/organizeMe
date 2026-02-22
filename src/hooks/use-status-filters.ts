"use client"

/**
 * useStatusFilters Hook
 *
 * Custom React hook for managing status filter selections with localStorage persistence.
 * Provides stateful access to selected filters and functions to toggle filter status.
 */

import * as React from "react"
import type { ProjectStatus } from "@/types/project"
import {
  getStatusFilters,
  toggleStatusFilter as toggleStatusFilterUtil,
  clearStatusFilters as clearStatusFiltersUtil,
  isStatusFilterActive as isStatusFilterActiveUtil,
} from "@/lib/status-filters"

/**
 * Return type for the useStatusFilters hook.
 */
export interface UseStatusFiltersReturn {
  /** Set of ProjectStatus values that are currently selected as filters */
  selectedStatuses: Set<ProjectStatus>
  /** Toggles a status filter's selection state */
  toggleStatusFilter: (status: ProjectStatus) => void
  /** Clears all selected status filters */
  clearStatusFilters: () => void
  /** Checks if a status is currently selected as a filter */
  isStatusFilterActive: (status: ProjectStatus) => boolean
}

/**
 * Custom hook for managing status filter selections.
 *
 * This hook provides:
 * - Stateful access to the selected status filters Set
 * - A function to toggle status filter selection
 * - A function to clear all filters
 * - A function to check if a status is actively filtered
 * - Automatic sync with localStorage on mount
 *
 * @returns Object containing selected filters Set and helper functions
 *
 * @example
 * ```tsx
 * function DashboardContent() {
 *   const { selectedStatuses, toggleStatusFilter, clearStatusFilters } = useStatusFilters()
 *
 *   return (
 *     <div>
 *       <button onClick={() => toggleStatusFilter('dirty')}>
 *         Toggle Dirty Filter
 *       </button>
 *       {selectedStatuses.size > 0 && (
 *         <button onClick={clearStatusFilters}>
 *           Clear Filters
 *         </button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useStatusFilters(): UseStatusFiltersReturn {
  // Initialize state with status filters from localStorage
  const [selectedStatuses, setSelectedStatuses] = React.useState<Set<ProjectStatus>>(() => new Set())

  // Load status filters from localStorage on mount
  React.useEffect(() => {
    setSelectedStatuses(getStatusFilters())
  }, [])

  /**
   * Toggles the selection state of a status filter.
   * Updates both component state and localStorage.
   */
  const toggleStatusFilter = React.useCallback((status: ProjectStatus) => {
    const updatedFilters = toggleStatusFilterUtil(status)
    setSelectedStatuses(new Set(updatedFilters))
  }, [])

  /**
   * Clears all selected status filters.
   * Updates both component state and localStorage.
   */
  const clearStatusFilters = React.useCallback(() => {
    const emptySet = clearStatusFiltersUtil()
    setSelectedStatuses(new Set(emptySet))
  }, [])

  /**
   * Checks if a status is currently selected as a filter.
   */
  const isStatusFilterActive = React.useCallback(
    (status: ProjectStatus) => {
      return isStatusFilterActiveUtil(status)
    },
    []
  )

  return {
    selectedStatuses,
    toggleStatusFilter,
    clearStatusFilters,
    isStatusFilterActive,
  }
}
