"use client"

import * as React from "react"
import type { Project } from "@organizeme/shared/types/project"
import type { RecentEntry } from "@organizeme/shared/lib/recent-projects"
import { useNavigation } from "@organizeme/shared/context/navigation-context"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { StatusBadge } from "./status-badge"

export interface RecentProjectsWidgetProps {
  recentProjects: RecentEntry[]
  projects: Project[]
  onClear: () => void
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

export function RecentProjectsWidget({
  recentProjects,
  projects,
  onClear,
}: RecentProjectsWidgetProps) {
  const { Link } = useNavigation()

  if (recentProjects.length === 0) return null

  // Map recent entries to actual project data
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const recentWithData = recentProjects
    .map((entry) => ({
      entry,
      project: projectMap.get(entry.id),
    }))
    .filter((item) => item.project != null)

  if (recentWithData.length === 0) return null

  return (
    <section aria-labelledby="recent-projects-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="recent-projects-heading" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ClockIcon className="h-4 w-4" />
          Recently Viewed
        </h2>
        <button
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {recentWithData.map(({ entry, project }) => (
          <Link
            key={entry.id}
            href={`/projects/${encodeURIComponent(entry.id)}`}
            className="block flex-shrink-0"
          >
            <Card className="w-48 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-sm truncate" title={project!.name}>
                  {project!.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                <div className="flex items-center justify-between">
                  <StatusBadge status={project!.status} showLabel={false} />
                  <span className="text-[10px] text-muted-foreground">
                    {formatTimeAgo(entry.viewedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
