/**
 * Project Sorting Utilities
 *
 * This module provides sorting functions for project lists based on various criteria
 * including name, last modified date, status, and project type.
 */

import type { Project, ProjectStatus } from '@/types/project'

/**
 * Available sort options for the project list.
 *
 * - 'name-asc': Sort by project name A-Z
 * - 'name-desc': Sort by project name Z-A
 * - 'modified-newest': Sort by last modified date, newest first
 * - 'modified-oldest': Sort by last modified date, oldest first
 * - 'status': Sort by project status (dirty, active, stale, clean, unknown)
 * - 'type': Sort by project type (based on hasPackageJson and hasReadme)
 */
export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'modified-newest'
  | 'modified-oldest'
  | 'status'
  | 'type'

/**
 * Human-readable labels for each sort option.
 * Used for displaying sort options in the UI.
 */
export const SORT_LABELS: Record<SortOption, string> = {
  'name-asc': 'Name (A-Z)',
  'name-desc': 'Name (Z-A)',
  'modified-newest': 'Last Modified (Newest)',
  'modified-oldest': 'Last Modified (Oldest)',
  status: 'Status',
  type: 'Type',
}

/**
 * Priority order for project statuses when sorting by status.
 * Lower index = higher priority (appears first in sorted list).
 */
const STATUS_PRIORITY: Record<ProjectStatus, number> = {
  dirty: 0,
  active: 1,
  stale: 2,
  clean: 3,
  unknown: 4,
}

/**
 * Compares two projects by name in ascending order (A-Z).
 */
function compareByNameAsc(a: Project, b: Project): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

/**
 * Compares two projects by name in descending order (Z-A).
 */
function compareByNameDesc(a: Project, b: Project): number {
  return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' })
}

/**
 * Compares two projects by last modified date, newest first.
 */
function compareByModifiedNewest(a: Project, b: Project): number {
  return b.lastModified.getTime() - a.lastModified.getTime()
}

/**
 * Compares two projects by last modified date, oldest first.
 */
function compareByModifiedOldest(a: Project, b: Project): number {
  return a.lastModified.getTime() - b.lastModified.getTime()
}

/**
 * Compares two projects by status priority.
 * Dirty projects appear first, followed by active, stale, clean, and unknown.
 */
function compareByStatus(a: Project, b: Project): number {
  const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
  // If statuses are the same, sort by name as a tiebreaker
  return statusDiff !== 0 ? statusDiff : compareByNameAsc(a, b)
}

/**
 * Determines a project's type score for sorting.
 * Projects with both package.json and README score highest,
 * followed by those with just package.json, then just README, then neither.
 */
function getProjectTypeScore(project: Project): number {
  if (project.hasPackageJson && project.hasReadme) return 0
  if (project.hasPackageJson) return 1
  if (project.hasReadme) return 2
  return 3
}

/**
 * Compares two projects by type.
 * Projects with more complete configuration appear first.
 */
function compareByType(a: Project, b: Project): number {
  const typeDiff = getProjectTypeScore(a) - getProjectTypeScore(b)
  // If types are the same, sort by name as a tiebreaker
  return typeDiff !== 0 ? typeDiff : compareByNameAsc(a, b)
}

/**
 * Returns a comparator function for the specified sort option.
 *
 * @param sortOption - The sort criteria to use
 * @returns A comparator function that can be used with Array.sort()
 *
 * @example
 * ```ts
 * const projects = [...];
 * const sorted = [...projects].sort(getSortComparator('name-asc'));
 * ```
 */
export function getSortComparator(
  sortOption: SortOption
): (a: Project, b: Project) => number {
  switch (sortOption) {
    case 'name-asc':
      return compareByNameAsc
    case 'name-desc':
      return compareByNameDesc
    case 'modified-newest':
      return compareByModifiedNewest
    case 'modified-oldest':
      return compareByModifiedOldest
    case 'status':
      return compareByStatus
    case 'type':
      return compareByType
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = sortOption
      return _exhaustive
  }
}

/**
 * Sorts an array of projects based on the specified sort option.
 * Returns a new sorted array without modifying the original.
 *
 * @param projects - The array of projects to sort
 * @param sortOption - The sort criteria to use
 * @returns A new sorted array of projects
 *
 * @example
 * ```ts
 * const projects = await getProjects();
 * const sortedProjects = sortProjects(projects, 'modified-newest');
 * ```
 */
export function sortProjects(
  projects: Project[],
  sortOption: SortOption
): Project[] {
  return [...projects].sort(getSortComparator(sortOption))
}
