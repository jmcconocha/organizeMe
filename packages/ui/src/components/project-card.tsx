'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { useNavigation } from "@organizeme/shared/context/navigation-context"

import { cn } from "@organizeme/shared/lib/utils"
import type { Project } from "@organizeme/shared/types/project"
import type { CardDensity } from "@organizeme/shared/types/dashboard-settings"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { StatusBadge } from "./status-badge"
import { getTagColor } from "@organizeme/shared/lib/tag-colors"
import { FavoriteButton } from "./favorite-button"
import { ArchiveButton } from "./archive-button"

/**
 * View mode and density variants for the project card.
 * - grid: Compact card layout for grid views
 * - list: Horizontal layout for list views
 * - compact: Reduced padding and smaller text for information density
 * - comfortable: Balanced spacing and readability (default)
 * - spacious: Increased padding and larger text for accessibility
 */
const projectCardVariants = cva("group transition-all duration-200", {
  variants: {
    viewMode: {
      grid: "flex flex-col",
      list: "flex flex-row items-center",
    },
    density: {
      compact: "",
      comfortable: "",
      spacious: "",
    },
  },
  defaultVariants: {
    viewMode: "grid",
    density: "comfortable",
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
  /** Whether this project is marked as a favorite */
  isFavorite?: boolean
  /** Callback when favorite status is toggled */
  onToggle?: () => void
  /** Whether this project is archived */
  isArchived?: boolean
  /** Callback when archive status is toggled */
  onArchiveToggle?: () => void
  /** Card density setting - affects spacing, padding, and font sizes */
  density?: CardDensity
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
      density = "comfortable",
      showDescription = true,
      showGitInfo = true,
      isFavorite = false,
      onToggle,
      isArchived = false,
      onArchiveToggle,
      ...props
    },
    ref
  ) => {
    const { Link } = useNavigation()
    const isGridView = viewMode === "grid"

    // Density-specific class mappings
    const densityClasses = {
      header: {
        compact: "pb-1",
        comfortable: "pb-2",
        spacious: "pb-3",
      },
      title: {
        compact: "text-base",
        comfortable: "text-lg",
        spacious: "text-xl",
      },
      description: {
        compact: "text-xs",
        comfortable: "text-sm",
        spacious: "text-base",
      },
      content: {
        compact: "pb-1 text-xs",
        comfortable: "pb-2 text-sm",
        spacious: "pb-3 text-base",
      },
      footer: {
        compact: "pt-1 pb-2 text-[10px]",
        comfortable: "pt-2 pb-4 text-xs",
        spacious: "pt-3 pb-5 text-sm",
      },
      tags: {
        compact: "gap-0.5 mt-1",
        comfortable: "gap-1 mt-2",
        spacious: "gap-1.5 mt-3",
      },
      badge: {
        compact: "text-[10px] px-1 py-0",
        comfortable: "text-xs",
        spacious: "text-sm px-2.5 py-0.5",
      },
    }

    // Error state card
    if (project.scanError) {
      return (
        <Card
          ref={ref}
          className={cn(
            projectCardVariants({ viewMode, density }),
            "border-destructive/50 bg-destructive/5 dark:bg-destructive/10",
            className
          )}
          {...props}
        >
          <CardHeader className={densityClasses.header[density]}>
            <div className="flex items-start justify-between gap-2">
              <CardTitle
                className={cn(densityClasses.title[density], "truncate text-destructive")}
                title={project.name}
              >
                {project.name}
              </CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Error
              </span>
            </div>
          </CardHeader>
          <CardContent className={cn(densityClasses.content[density], "flex-1")}>
            <p className="text-sm text-destructive/80">{project.scanError}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {project.path}
            </p>
          </CardContent>
          <CardFooter className={cn(densityClasses.footer[density], "text-muted-foreground")}>
            <span className="text-xs">Use the Refresh button to retry scanning</span>
          </CardFooter>
        </Card>
      )
    }

    return (
      <Link href={`/projects/${encodeURIComponent(project.id)}`} className="block">
        <Card
          ref={ref}
          className={cn(
            projectCardVariants({ viewMode, density }),
            "hover:border-primary/50 hover:shadow-md cursor-pointer",
            isFavorite && "border-primary/30 bg-primary/5 dark:bg-primary/10",
            className
          )}
          {...props}
        >
          {isGridView ? (
            // Grid View Layout
            <>
              <CardHeader className={densityClasses.header[density]}>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle
                    className={cn(densityClasses.title[density], "truncate")}
                    title={project.name}
                  >
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <FavoriteButton
                      isFavorite={isFavorite}
                      onToggle={onToggle}
                      size="sm"
                    />
                    <ArchiveButton
                      isArchived={isArchived}
                      onToggle={onArchiveToggle}
                      size="sm"
                    />
                    <StatusBadge status={project.status} showLabel={false} />
                  </div>
                </div>
                {showDescription && project.description && (
                  <CardDescription className={cn(densityClasses.description[density], "line-clamp-2")}>
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className={cn(densityClasses.content[density], "flex-1")}>
                {showGitInfo && project.gitInfo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
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
                  <span className="text-muted-foreground">No Git</span>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className={cn("flex flex-wrap", densityClasses.tags[density])}>
                    {project.tags.map((tag) => (
                      <Badge key={tag} className={cn("border", densityClasses.badge[density], getTagColor(tag))}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {project.notes && (
                  <p className={cn(
                    "text-muted-foreground line-clamp-2 italic",
                    density === "compact" ? "mt-1 text-[10px]" : density === "spacious" ? "mt-3 text-sm" : "mt-2 text-xs"
                  )}>
                    {project.notes}
                  </p>
                )}
              </CardContent>
              <CardFooter className={cn(densityClasses.footer[density], "flex items-center justify-between text-muted-foreground")}>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-secondary"
                    title="Add tag"
                    aria-label="Add tag"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <TagIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            // List View Layout
            <>
              <div className={cn(
                "flex-shrink-0 flex items-center gap-2",
                density === "compact" ? "p-2" : density === "spacious" ? "p-5" : "p-4"
              )}>
                <FavoriteButton
                  isFavorite={isFavorite}
                  onToggle={onToggle}
                  size="sm"
                />
                <ArchiveButton
                  isArchived={isArchived}
                  onToggle={onArchiveToggle}
                  size="sm"
                />
                <StatusBadge status={project.status} showLabel={false} />
              </div>
              <CardHeader className={cn(
                "flex-1 pl-0",
                density === "compact" ? "py-2" : density === "spacious" ? "py-5" : "py-4"
              )}>
                <div className="flex items-center gap-4">
                  <CardTitle
                    className={cn(
                      "truncate max-w-[200px]",
                      densityClasses.title[density]
                    )}
                    title={project.name}
                  >
                    {project.name}
                  </CardTitle>
                  {showGitInfo && project.gitInfo && (
                    <span className={cn("inline-flex items-center gap-1 text-muted-foreground", densityClasses.content[density])}>
                      <BranchIcon className="h-3 w-3" />
                      <span className="truncate max-w-[100px]" title={project.gitInfo.branch}>
                        {project.gitInfo.branch}
                      </span>
                    </span>
                  )}
                  {!project.gitInfo && (
                    <span className={cn("text-muted-foreground", densityClasses.content[density])}>No Git</span>
                  )}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag) => (
                        <Badge key={tag} className={cn("border", densityClasses.badge[density], getTagColor(tag))}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {showDescription && project.description && (
                  <CardDescription className={cn("truncate max-w-[300px]", densityClasses.description[density])}>
                    {project.description}
                  </CardDescription>
                )}
                {project.notes && (
                  <p className={cn("truncate max-w-[300px] text-muted-foreground italic", densityClasses.description[density])}>
                    {project.notes}
                  </p>
                )}
              </CardHeader>
              <div className={cn(
                "flex items-center gap-4 text-muted-foreground",
                density === "compact" ? "px-2 py-2 text-[10px]" : density === "spacious" ? "px-5 py-5 text-sm" : "px-4 py-4 text-xs"
              )}>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-secondary"
                    title="Add tag"
                    aria-label="Add tag"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <TagIcon className="h-4 w-4" />
                  </Button>
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

/**
 * Simple tag icon component.
 */
function TagIcon({ className }: { className?: string }) {
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
        d="M2.5 2A1.5 1.5 0 0 0 1 3.5v4.879a1.5 1.5 0 0 0 .44 1.06l6.5 6.5a1.5 1.5 0 0 0 2.12 0l4.879-4.879a1.5 1.5 0 0 0 0-2.12l-6.5-6.5a1.5 1.5 0 0 0-1.06-.44H2.5ZM5 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export { ProjectCard, projectCardVariants }
