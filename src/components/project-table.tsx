'use client'

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { FavoriteButton } from "@/components/favorite-button"
import { useFavorites } from "@/hooks/use-favorites"

/**
 * Column definitions for the project table.
 * Each column has a key, label, and optional width.
 */
interface TableColumn {
  key: string
  label: string
  className?: string
}

const columns: TableColumn[] = [
  { key: "favorite", label: "", className: "w-[50px]" },
  { key: "status", label: "Status", className: "w-[100px]" },
  { key: "name", label: "Name", className: "min-w-[150px]" },
  { key: "branch", label: "Branch", className: "w-[140px]" },
  { key: "changes", label: "Changes", className: "w-[100px] text-center" },
  { key: "modified", label: "Last Modified", className: "w-[140px]" },
  { key: "indicators", label: "", className: "w-[60px]" },
]

export interface ProjectTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The list of projects to display */
  projects: Project[]
  /** Optional callback when a project row is clicked */
  onProjectClick?: (project: Project) => void
  /** Whether to show an empty state message when no projects */
  showEmptyState?: boolean
  /** Custom empty state message */
  emptyMessage?: string
}

/**
 * Formats a date to a relative time string (e.g., "2 days ago").
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)

  if (diffInMonths > 0) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`
  }
  if (diffInWeeks > 0) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`
  }
  if (diffInDays > 0) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`
  }
  if (diffInHours > 0) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`
  }
  if (diffInMinutes > 0) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`
  }
  return "Just now"
}

/**
 * Simple branch icon component (Git branch).
 */
function BranchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * ProjectTable component for displaying projects in a tabular format.
 *
 * Features:
 * - Tabular layout with sortable-friendly column structure
 * - Status badge in the first column for quick scanning
 * - Git branch and uncommitted changes display
 * - Relative time formatting for last modified date
 * - Package.json and README indicators
 * - Clickable rows linking to project detail pages
 * - Empty state message when no projects
 * - Accessible table structure with proper headers
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ProjectTable projects={projects} />
 *
 * // With custom empty message
 * <ProjectTable
 *   projects={projects}
 *   showEmptyState
 *   emptyMessage="No projects found in this directory."
 * />
 *
 * // With click handler
 * <ProjectTable
 *   projects={projects}
 *   onProjectClick={(project) => console.log('Selected:', project.name)}
 * />
 * ```
 */
const ProjectTable = React.forwardRef<HTMLDivElement, ProjectTableProps>(
  (
    {
      className,
      projects,
      onProjectClick,
      showEmptyState = true,
      emptyMessage = "No projects found.",
      ...props
    },
    ref
  ) => {
    const { isFavorite, toggleFavorite } = useFavorites()

    if (projects.length === 0 && showEmptyState) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex items-center justify-center p-8 text-muted-foreground",
            className
          )}
          {...props}
        >
          <p>{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const isProjectFavorite = isFavorite(project.id)
              return (
                <TableRow
                  key={project.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/70",
                    isProjectFavorite && "bg-primary/5 dark:bg-primary/10"
                  )}
                  onClick={() => onProjectClick?.(project)}
                >

                  {/* Favorite Column */}
                  <TableCell className="py-3">
                    <FavoriteButton
                      isFavorite={isProjectFavorite}
                      onToggle={() => toggleFavorite(project.id)}
                      size="sm"
                    />
                  </TableCell>

                {/* Status Column */}
                <TableCell className="py-3">
                  <StatusBadge
                    status={project.status}
                    showIcon={true}
                    showLabel={true}
                  />
                </TableCell>

                {/* Name Column */}
                <TableCell className="py-3">
                  <Link
                    href={`/projects/${encodeURIComponent(project.id)}`}
                    className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="truncate max-w-[250px] block" title={project.name}>
                      {project.name}
                    </span>
                  </Link>
                  {project.description && (
                    <p
                      className="text-xs text-muted-foreground truncate max-w-[250px] mt-0.5"
                      title={project.description}
                    >
                      {project.description}
                    </p>
                  )}
                </TableCell>

                {/* Branch Column */}
                <TableCell className="py-3">
                  {project.gitInfo ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <BranchIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span
                        className="truncate max-w-[100px]"
                        title={project.gitInfo.branch}
                      >
                        {project.gitInfo.branch}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No Git</span>
                  )}
                </TableCell>

                {/* Changes Column */}
                <TableCell className="py-3 text-center">
                  {project.gitInfo?.isDirty ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                      {project.gitInfo.uncommittedChanges}
                    </span>
                  ) : project.gitInfo ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Last Modified Column */}
                <TableCell className="py-3">
                  <span
                    className="text-sm text-muted-foreground"
                    title={new Date(project.lastModified).toLocaleString()}
                  >
                    {formatRelativeTime(project.lastModified)}
                  </span>
                </TableCell>

                {/* Indicators Column */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    {project.hasPackageJson && (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary text-xs"
                        title="Has package.json"
                        aria-label="Has package.json"
                      >
                        📦
                      </span>
                    )}
                    {project.hasReadme && (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary text-xs"
                        title="Has README"
                        aria-label="Has README"
                      >
                        📄
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }
)
ProjectTable.displayName = "ProjectTable"

export { ProjectTable }
