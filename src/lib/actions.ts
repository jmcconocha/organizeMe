'use server'

/**
 * Server Actions Module
 *
 * This module provides server-side actions for the project management dashboard.
 * These actions handle data mutations and cache revalidation.
 */

import { revalidatePath } from 'next/cache'
import { scanProjects, filterSuccessfulScans, filterScanErrors } from './project-scanner'
import { enrichProjectsWithGitInfo } from './git-utils'
import type { ProjectListResponse } from '@/types/project'

/**
 * Result of a refresh operation.
 */
export interface RefreshResult {
  success: boolean
  projectCount: number
  errorCount: number
  message: string
}

/**
 * Refreshes the project list by rescanning the projects directory.
 *
 * This server action:
 * 1. Scans the configured projects directory for all projects
 * 2. Enriches projects with Git status information
 * 3. Revalidates the dashboard cache to show updated data
 *
 * @returns Promise resolving to refresh result with project count
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client'
 * import { refreshProjects } from '@/lib/actions'
 *
 * function RefreshButton() {
 *   const handleRefresh = async () => {
 *     const result = await refreshProjects()
 *     console.log(result.message)
 *   }
 *   return <button onClick={handleRefresh}>Refresh</button>
 * }
 * ```
 */
export async function refreshProjects(): Promise<RefreshResult> {
  try {
    // Scan the projects directory
    const results = await scanProjects()

    // Get successful scans and errors
    const projects = filterSuccessfulScans(results)
    const errors = filterScanErrors(results)

    // Enrich with Git information
    const enrichedProjects = await enrichProjectsWithGitInfo(projects)

    // Revalidate the dashboard pages
    revalidatePath('/')
    revalidatePath('/projects')

    return {
      success: true,
      projectCount: enrichedProjects.length,
      errorCount: errors.length,
      message: errors.length > 0
        ? `Refreshed ${enrichedProjects.length} projects with ${errors.length} errors`
        : `Successfully refreshed ${enrichedProjects.length} projects`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      projectCount: 0,
      errorCount: 1,
      message: `Failed to refresh projects: ${errorMessage}`,
    }
  }
}

/**
 * Result of fetching projects, including optional error.
 */
export interface FetchProjectsResult {
  response: ProjectListResponse
  error?: string
}

/**
 * Fetches fresh project data without caching.
 *
 * This server action bypasses the cache and returns the latest
 * project data directly. Useful for client-side data fetching
 * with SWR or React Query.
 *
 * @returns Promise resolving to FetchProjectsResult with response and optional error
 */
export async function getProjectsFresh(): Promise<FetchProjectsResult> {
  try {
    // Scan the projects directory
    const results = await scanProjects()

    // Get successful scans
    const projects = filterSuccessfulScans(results)

    // Enrich with Git information
    const enrichedProjects = await enrichProjectsWithGitInfo(projects)

    // Sort by lastModified (most recent first)
    const sortedProjects = enrichedProjects.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
    )

    return {
      response: {
        projects: sortedProjects,
        total: sortedProjects.length,
        scannedAt: new Date(),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      response: {
        projects: [],
        total: 0,
        scannedAt: new Date(),
      },
      error: `Failed to fetch projects: ${errorMessage}`,
    }
  }
}

/**
 * Refreshes a single project by ID.
 *
 * This server action revalidates the cache for a specific project's
 * detail page after updates have been made.
 *
 * @param projectId - The ID of the project to refresh
 */
export async function refreshProject(projectId: string): Promise<void> {
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/')
}

/**
 * Result of opening a project in Finder.
 */
export interface OpenInFinderResult {
  success: boolean
  message: string
}

/**
 * Opens a project directory in the system file manager (Finder on macOS).
 *
 * This server action uses the system's native 'open' command to reveal
 * the project directory in Finder.
 *
 * @param projectPath - The full filesystem path to the project directory
 * @returns Promise resolving to OpenInFinderResult
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client'
 * import { openInFinder } from '@/lib/actions'
 *
 * function OpenButton({ path }: { path: string }) {
 *   const handleOpen = async () => {
 *     const result = await openInFinder(path)
 *     if (!result.success) {
 *       console.error(result.message)
 *     }
 *   }
 *   return <button onClick={handleOpen}>Open in Finder</button>
 * }
 * ```
 */
export async function openInFinder(projectPath: string): Promise<OpenInFinderResult> {
  try {
    // Validate path exists
    const { access } = await import('fs/promises')
    await access(projectPath)

    // Use child_process to open the directory
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // Determine the command based on platform
    const platform = process.platform
    let command: string

    if (platform === 'darwin') {
      // macOS: use 'open' command
      command = `open "${projectPath}"`
    } else if (platform === 'win32') {
      // Windows: use 'explorer' command
      command = `explorer "${projectPath}"`
    } else {
      // Linux: use 'xdg-open' command
      command = `xdg-open "${projectPath}"`
    }

    await execAsync(command)

    return {
      success: true,
      message: `Opened ${projectPath} in file manager`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Failed to open in Finder: ${errorMessage}`,
    }
  }
}
