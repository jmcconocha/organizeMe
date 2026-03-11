/**
 * Recent Projects Management Module
 *
 * Tracks recently viewed projects using localStorage.
 * Stores project IDs with timestamps, ordered by most recent.
 */

const STORAGE_KEY = 'organize-me-recent-projects'
const MAX_RECENT = 10

export interface RecentEntry {
  id: string
  viewedAt: number
}

export function getRecentProjects(): RecentEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return parsed as RecentEntry[]
    }
    return []
  } catch (error) {
    console.error('Failed to load recent projects from localStorage:', error)
    return []
  }
}

function saveRecentProjects(entries: RecentEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Failed to save recent projects to localStorage:', error)
  }
}

export function trackProjectView(projectId: string): RecentEntry[] {
  const entries = getRecentProjects().filter((e) => e.id !== projectId)
  const updated: RecentEntry[] = [
    { id: projectId, viewedAt: Date.now() },
    ...entries,
  ].slice(0, MAX_RECENT)

  saveRecentProjects(updated)
  return updated
}

export function clearRecentProjects(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}
