import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"

/**
 * View mode variants for the project card.
 * - grid: Compact card layout for grid views
 * - list: Horizontal layout for list views
 */
const projectCardVariants = cva("group transition-all duration-200", {
  variants: {
    viewMode: {
      grid: "flex flex-col",
      list: "flex flex-row items-center",
    },
  },
  defaultVariants: {
    viewMode: "grid",
  },
})

export interface ProjectCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof projectCardVariants> {
  /** The project data to display */
  project: Project
  /** Whether to show the project description */
  showDescription?: boolean
  /** Whether to show Git information */
  showGitInfo?: boolean
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
 * ProjectCard component for displaying project information in grid or list views.
 *
 * Features:
 * - Project name with truncation for long names
 * - Status badge showing project health
 * - Optional description display
 * - Git branch and dirty state indicators
 * - Last modified timestamp
 * - Indicators for package.json and README
 * - Clickable to navigate to project detail page
 *
 * @example
 * ```tsx
 * // Grid view
 * <ProjectCard project={project} viewMode="grid" />
 *
 * // List view with description
 * <ProjectCard project={project} viewMode="list" showDescription />
 *
 * // Full details
 * <ProjectCard project={project} showDescription showGitInfo />
 * ```
 */
const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    {
      className,
      project,
      viewMode = "grid",
      showDescription = true,
      showGitInfo = true,
      ...props
    },
    ref
  ) => {
    const isGridView = viewMode === "grid"

    return (
      <Link href={`/projects/${encodeURIComponent(project.id)}`} className="block">
        <Card
          ref={ref}
          className={cn(
            projectCardVariants({ viewMode }),
            "hover:border-primary/50 hover:shadow-md cursor-pointer",
            className
          )}
          {...props}
        >
          {isGridView ? (
            // Grid View Layout
            <>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle
                    className="text-lg truncate"
                    title={project.name}
                  >
                    {project.name}
                  </CardTitle>
                  <StatusBadge status={project.status} showLabel={false} />
                </div>
                {showDescription && project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2 flex-1">
                {showGitInfo && project.gitInfo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <BranchIcon className="h-3 w-3" />
                      <span className="truncate max-w-[120px]" title={project.gitInfo.branch}>
                        {project.gitInfo.branch}
                      </span>
                    </span>
                    {project.gitInfo.isDirty && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {project.gitInfo.uncommittedChanges} changes
                      </span>
                    )}
                  </div>
                )}
                {!project.gitInfo && (
                  <span className="text-xs text-muted-foreground">No Git</span>
                )}
              </CardContent>
              <CardFooter className="pt-2 pb-4 flex items-center justify-between text-xs text-muted-foreground">
                <span title={new Date(project.lastModified).toLocaleString()}>
                  {formatRelativeTime(project.lastModified)}
                </span>
                <div className="flex items-center gap-1.5">
                  {project.hasPackageJson && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary"
                      title="Has package.json"
                      aria-label="Has package.json"
                    >
                      📦
                    </span>
                  )}
                  {project.hasReadme && (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary"
                      title="Has README"
                      aria-label="Has README"
                    >
                      📄
                    </span>
                  )}
                </div>
              </CardFooter>
            </>
          ) : (
            // List View Layout
            <>
              <div className="flex-shrink-0 p-4">
                <StatusBadge status={project.status} showLabel={false} />
              </div>
              <CardHeader className="flex-1 py-4 pl-0">
                <div className="flex items-center gap-4">
                  <CardTitle
                    className="text-base truncate max-w-[200px]"
                    title={project.name}
                  >
                    {project.name}
                  </CardTitle>
                  {showGitInfo && project.gitInfo && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BranchIcon className="h-3 w-3" />
                      <span className="truncate max-w-[100px]" title={project.gitInfo.branch}>
                        {project.gitInfo.branch}
                      </span>
                    </span>
                  )}
                  {!project.gitInfo && (
                    <span className="text-xs text-muted-foreground">No Git</span>
                  )}
                </div>
                {showDescription && project.description && (
                  <CardDescription className="truncate max-w-[300px]">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <div className="flex items-center gap-4 px-4 py-4 text-xs text-muted-foreground">
                {project.gitInfo?.isDirty && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {project.gitInfo.uncommittedChanges} changes
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  {project.hasPackageJson && (
                    <span title="Has package.json" aria-label="Has package.json">
                      📦
                    </span>
                  )}
                  {project.hasReadme && (
                    <span title="Has README" aria-label="Has README">
                      📄
                    </span>
                  )}
                </div>
                <span
                  className="ml-auto"
                  title={new Date(project.lastModified).toLocaleString()}
                >
                  {formatRelativeTime(project.lastModified)}
                </span>
              </div>
            </>
          )}
        </Card>
      </Link>
    )
  }
)
ProjectCard.displayName = "ProjectCard"

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

export { ProjectCard, projectCardVariants }
