/**
 * Main Dashboard Page
 *
 * Displays all projects in a grid or table view with at-a-glance status information.
 * Provides view switching, refresh capability, and status summary.
 */

import { Suspense } from "react"
import { scanProjects, filterSuccessfulScans, filterScanErrors } from "@/lib/project-scanner"
import { enrichProjectsWithGitInfo } from "@/lib/git-utils"
import { getCachedProjects, setCachedProjects, getCacheAge } from "@/lib/project-cache"
import type { Project, ProjectStatus } from "@organizeme/shared/types/project"
import { DashboardWrapper } from "./dashboard-wrapper"
import { DashboardSkeleton } from "@organizeme/ui/components/dashboard-skeleton"
import { Header } from "@organizeme/ui/components/header"

/**
 * Fetches and prepares project data for the dashboard.
 */
async function getProjects(): Promise<{
  projects: Project[]
  fromCache: boolean
  cacheAgeMs: number | null
  scanErrors: number
  error?: string
}> {
  // Try cache first
  const cached = getCachedProjects()
  if (cached) {
    return {
      projects: cached,
      fromCache: true,
      cacheAgeMs: getCacheAge(),
      scanErrors: 0,
    }
  }

  try {
    // Scan the projects directory
    const scanResults = await scanProjects()

    // Get successfully scanned projects and errors
    const projects = filterSuccessfulScans(scanResults)
    const errors = filterScanErrors(scanResults)

    // Enrich projects with Git information
    const enrichedProjects = await enrichProjectsWithGitInfo(projects)

    // Cache the results
    setCachedProjects(enrichedProjects)

    return {
      projects: enrichedProjects,
      fromCache: false,
      cacheAgeMs: null,
      scanErrors: errors.length,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return { projects: [], fromCache: false, cacheAgeMs: null, scanErrors: 0, error: errorMessage }
  }
}

/**
 * Computes status summary counts from project list.
 */
function getStatusSummary(
  projects: Project[]
): Record<ProjectStatus, number> & { total: number } {
  const summary: Record<ProjectStatus, number> & { total: number } = {
    active: 0,
    stale: 0,
    clean: 0,
    dirty: 0,
    unknown: 0,
    total: projects.length,
  }

  for (const project of projects) {
    summary[project.status]++
  }

  return summary
}

/**
 * Dashboard page component.
 *
 * Server Component that fetches project data and renders the dashboard.
 */
export default async function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header with Theme Toggle */}
      <Header
        title="Project Dashboard"
        subtitle="Your unified view for tracking development projects"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <ProjectsLoader />
        </Suspense>
      </div>
    </main>
  )
}

/**
 * Async component that loads and displays projects.
 * Wrapped in Suspense for streaming.
 */
async function ProjectsLoader() {
  const { projects, fromCache, cacheAgeMs, scanErrors, error } = await getProjects()
  const statusSummary = getStatusSummary(projects)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <ErrorIcon className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to Load Projects</h2>
        <p className="text-muted-foreground max-w-md mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">
          Make sure the PROJECTS_PATH environment variable is set correctly, or
          try refreshing the page.
        </p>
      </div>
    )
  }

  return (
    <DashboardWrapper
      projects={projects}
      statusSummary={statusSummary}
      fromCache={fromCache}
      cacheAgeMs={cacheAgeMs}
      scanErrors={scanErrors}
    />
  )
}

/**
 * Error icon component.
 */
function ErrorIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  )
}
