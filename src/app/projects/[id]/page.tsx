/**
 * Project Detail Page
 *
 * Displays detailed information about a single project including:
 * - Project metadata (name, description, path)
 * - Git information (branch, commit history, status)
 * - Quick actions (Open in Finder, Refresh)
 */

import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"

import { scanProjects, filterSuccessfulScans } from "@/lib/project-scanner"
import { getGitStatus, determineProjectStatus } from "@/lib/git-utils"
import type { Project } from "@/types/project"
import { StatusBadge } from "@/components/status-badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectDetailActions } from "./project-detail-actions"

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Fetches a single project by ID with Git information.
 */
async function getProject(id: string): Promise<Project | null> {
  try {
    // Scan all projects to find the matching one
    const scanResults = await scanProjects()
    const projects = filterSuccessfulScans(scanResults)

    // Find the project by ID
    const project = projects.find((p) => p.id === id)

    if (!project) {
      return null
    }

    // Enrich with Git information
    const gitResult = await getGitStatus(project.path)

    if (gitResult.gitInfo) {
      project.gitInfo = gitResult.gitInfo
      project.status = determineProjectStatus(gitResult.gitInfo, project.lastModified)
    }

    return project
  } catch {
    return null
  }
}

/**
 * Formats a date to a readable string.
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Formats a relative time string.
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
 * Back arrow icon.
 */
function ArrowLeftIcon({ className }: { className?: string }) {
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
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  )
}

/**
 * Git branch icon.
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
 * Commit icon.
 */
function CommitIcon({ className }: { className?: string }) {
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
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  )
}

/**
 * Loading skeleton for the project detail page.
 */
function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-muted rounded" />
        <div className="h-48 bg-muted rounded" />
      </div>
    </div>
  )
}

/**
 * Project detail content component.
 */
async function ProjectDetailContent({ id }: { id: string }) {
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} showIcon showLabel />
          </div>
          {project.description && (
            <p className="text-lg text-muted-foreground">{project.description}</p>
          )}
        </div>
        <ProjectDetailActions projectPath={project.path} projectId={project.id} />
      </div>

      <Separator />

      {/* Project Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Project Info</CardTitle>
            <CardDescription>Basic project metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Path</dt>
              <dd className="mt-1 text-sm font-mono bg-muted px-2 py-1 rounded break-all">
                {project.path}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Modified</dt>
              <dd className="mt-1 text-sm">
                {formatDate(project.lastModified)}
                <span className="text-muted-foreground ml-2">
                  ({formatRelativeTime(project.lastModified)})
                </span>
              </dd>
            </div>
            <div className="flex gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">package.json</dt>
                <dd className="mt-1 text-sm">
                  {project.hasPackageJson ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckIcon className="h-4 w-4" />
                      Present
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not found</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">README</dt>
                <dd className="mt-1 text-sm">
                  {project.hasReadme ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckIcon className="h-4 w-4" />
                      Present
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not found</span>
                  )}
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Git Information */}
        <Card>
          <CardHeader>
            <CardTitle>Git Information</CardTitle>
            <CardDescription>Repository status and history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.gitInfo ? (
              <>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Branch</dt>
                  <dd className="mt-1 text-sm flex items-center gap-2">
                    <BranchIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{project.gitInfo.branch}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Working Directory</dt>
                  <dd className="mt-1 text-sm">
                    {project.gitInfo.isDirty ? (
                      <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        {project.gitInfo.uncommittedChanges} uncommitted{" "}
                        {project.gitInfo.uncommittedChanges === 1 ? "change" : "changes"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckIcon className="h-4 w-4" />
                        Clean
                      </span>
                    )}
                  </dd>
                </div>
                {(project.gitInfo.aheadBy > 0 || project.gitInfo.behindBy > 0) && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Remote Status</dt>
                    <dd className="mt-1 text-sm flex gap-4">
                      {project.gitInfo.aheadBy > 0 && (
                        <span className="text-blue-600 dark:text-blue-400">
                          +{project.gitInfo.aheadBy} ahead
                        </span>
                      )}
                      {project.gitInfo.behindBy > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">
                          -{project.gitInfo.behindBy} behind
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {project.gitInfo.lastCommitMessage && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Last Commit</dt>
                    <dd className="mt-1 text-sm">
                      <div className="flex items-start gap-2">
                        <CommitIcon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium line-clamp-2">
                            {project.gitInfo.lastCommitMessage}
                          </p>
                          {project.gitInfo.lastCommitDate && (
                            <p className="text-muted-foreground text-xs mt-1">
                              {formatRelativeTime(project.gitInfo.lastCommitDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </dd>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <NoGitIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">This project is not a Git repository</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Check icon.
 */
function CheckIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

/**
 * No Git icon (crossed out git icon).
 */
function NoGitIcon({ className }: { className?: string }) {
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
        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

/**
 * Project Detail Page component.
 */
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<ProjectDetailSkeleton />}>
          <ProjectDetailContent id={id} />
        </Suspense>
      </div>
    </main>
  )
}
