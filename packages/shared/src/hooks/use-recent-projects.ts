"use client"

import * as React from "react"
import {
  getRecentProjects,
  trackProjectView as trackViewUtil,
  clearRecentProjects as clearUtil,
  type RecentEntry,
} from "../lib/recent-projects"

export interface UseRecentProjectsReturn {
  recentProjects: RecentEntry[]
  trackProjectView: (projectId: string) => void
  clearRecentProjects: () => void
}

export function useRecentProjects(): UseRecentProjectsReturn {
  const [recentProjects, setRecentProjects] = React.useState<RecentEntry[]>([])

  React.useEffect(() => {
    setRecentProjects(getRecentProjects())
  }, [])

  const trackProjectView = React.useCallback((projectId: string) => {
    const updated = trackViewUtil(projectId)
    setRecentProjects(updated)
  }, [])

  const clearRecentProjects = React.useCallback(() => {
    clearUtil()
    setRecentProjects([])
  }, [])

  return {
    recentProjects,
    trackProjectView,
    clearRecentProjects,
  }
}
