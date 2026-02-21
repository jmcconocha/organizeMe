"use client"

/**
 * useFavorites Hook
 *
 * Custom React hook for managing favorite projects with localStorage persistence.
 * Provides stateful access to favorites and functions to toggle favorite status.
 */

import * as React from "react"
import {
  getFavorites,
  toggleFavorite as toggleFavoriteUtil,
  isFavorite as isFavoriteUtil,
} from "@/lib/favorites"

/**
 * Return type for the useFavorites hook.
 */
export interface UseFavoritesReturn {
  /** Set of project IDs that are marked as favorites */
  favorites: Set<string>
  /** Toggles a project's favorite status */
  toggleFavorite: (projectId: string) => void
  /** Checks if a project is a favorite */
  isFavorite: (projectId: string) => boolean
}

/**
 * Custom hook for managing favorite projects.
 *
 * This hook provides:
 * - Stateful access to the favorites Set
 * - A function to toggle favorite status
 * - A function to check if a project is favorited
 * - Automatic sync with localStorage on mount
 *
 * @returns Object containing favorites Set and helper functions
 *
 * @example
 * ```tsx
 * function ProjectCard({ project }: { project: Project }) {
 *   const { favorites, toggleFavorite, isFavorite } = useFavorites()
 *
 *   return (
 *     <div>
 *       <h2>{project.name}</h2>
 *       <button onClick={() => toggleFavorite(project.id)}>
 *         {isFavorite(project.id) ? 'Unfavorite' : 'Favorite'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFavorites(): UseFavoritesReturn {
  // Initialize state with favorites from localStorage
  const [favorites, setFavorites] = React.useState<Set<string>>(() => new Set())

  // Load favorites from localStorage on mount
  React.useEffect(() => {
    setFavorites(getFavorites())
  }, [])

  /**
   * Toggles the favorite status of a project.
   * Updates both component state and localStorage.
   */
  const toggleFavorite = React.useCallback((projectId: string) => {
    const updatedFavorites = toggleFavoriteUtil(projectId)
    setFavorites(new Set(updatedFavorites))
  }, [])

  /**
   * Checks if a project is currently favorited.
   */
  const isFavorite = React.useCallback(
    (projectId: string) => {
      return isFavoriteUtil(projectId)
    },
    []
  )

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  }
}
