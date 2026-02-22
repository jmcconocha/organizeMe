"use client"

/**
 * useArchive Hook
 *
 * Custom React hook for managing archived projects with localStorage persistence.
 * Provides stateful access to archived projects and functions to toggle archive status.
 */

import * as React from "react"
import {
  getArchivedProjects,
  toggleArchive as toggleArchiveUtil,
  isArchived as isArchivedUtil,
} from "@/lib/archive"

/**
 * Return type for the useArchive hook.
 */
export interface UseArchiveReturn {
  /** Set of project IDs that are marked as archived */
  archivedProjects: Set<string>
  /** Toggles a project's archive status */
  toggleArchive: (projectId: string) => void
  /** Checks if a project is archived */
  isArchived: (projectId: string) => boolean
}

/**
 * Custom hook for managing archived projects.
 *
 * This hook provides:
 * - Stateful access to the archivedProjects Set
 * - A function to toggle archive status
 * - A function to check if a project is archived
 * - Automatic sync with localStorage on mount
 *
 * @returns Object containing archivedProjects Set and helper functions
 *
 * @example
 * ```tsx
 * function ProjectCard({ project }: { project: Project }) {
 *   const { archivedProjects, toggleArchive, isArchived } = useArchive()
 *
 *   return (
 *     <div>
 *       <h2>{project.name}</h2>
 *       <button onClick={() => toggleArchive(project.id)}>
 *         {isArchived(project.id) ? 'Unarchive' : 'Archive'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useArchive(): UseArchiveReturn {
  // Initialize state with archived projects from localStorage
  const [archivedProjects, setArchivedProjects] = React.useState<Set<string>>(() => new Set())

  // Load archived projects from localStorage on mount
  React.useEffect(() => {
    setArchivedProjects(getArchivedProjects())
  }, [])

  /**
   * Toggles the archive status of a project.
   * Updates both component state and localStorage.
   */
  const toggleArchive = React.useCallback((projectId: string) => {
    const updatedArchived = toggleArchiveUtil(projectId)
    setArchivedProjects(new Set(updatedArchived))
  }, [])

  /**
   * Checks if a project is currently archived.
   */
  const isArchived = React.useCallback(
    (projectId: string) => {
      return isArchivedUtil(projectId)
    },
    []
  )

  return {
    archivedProjects,
    toggleArchive,
    isArchived,
  }
}
