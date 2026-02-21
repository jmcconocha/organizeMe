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

/**
 * Result of opening a project in an application.
 */
export interface OpenInAppResult {
  success: boolean
  message: string
}

/**
 * Opens a project directory in the system's default terminal.
 *
 * This server action uses the system's native terminal application:
 * - macOS: Terminal.app
 * - Windows: cmd.exe
 * - Linux: x-terminal-emulator or gnome-terminal
 *
 * @param projectPath - The full filesystem path to the project directory
 * @returns Promise resolving to OpenInAppResult
 */
export async function openInTerminal(projectPath: string): Promise<OpenInAppResult> {
  try {
    // Validate path exists
    const { access } = await import('fs/promises')
    await access(projectPath)

    // Use child_process to open terminal
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // Determine the command based on platform
    const platform = process.platform
    let command: string

    if (platform === 'darwin') {
      // macOS: use 'open' command with Terminal.app
      command = `open -a Terminal "${projectPath}"`
    } else if (platform === 'win32') {
      // Windows: use 'start cmd' command
      command = `start cmd /K "cd /d ${projectPath}"`
    } else {
      // Linux: try common terminal emulators
      command = `x-terminal-emulator --working-directory="${projectPath}" || gnome-terminal --working-directory="${projectPath}" || xterm -e "cd '${projectPath}' && $SHELL"`
    }

    await execAsync(command)

    return {
      success: true,
      message: `Opened ${projectPath} in terminal`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Failed to open in terminal: ${errorMessage}`,
    }
  }
}

/**
 * Opens a project directory in Visual Studio Code.
 *
 * This server action uses the 'code' CLI command which must be installed
 * and available in the system PATH.
 *
 * @param projectPath - The full filesystem path to the project directory
 * @returns Promise resolving to OpenInAppResult
 */
export async function openInVSCode(projectPath: string): Promise<OpenInAppResult> {
  try {
    // Validate path exists
    const { access } = await import('fs/promises')
    await access(projectPath)

    // Use child_process to open VS Code
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // Use 'code' command (works on all platforms if VS Code is installed)
    const command = `code "${projectPath}"`

    await execAsync(command)

    return {
      success: true,
      message: `Opened ${projectPath} in VS Code`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Failed to open in VS Code: ${errorMessage}`,
    }
  }
}

/**
 * Opens a URL in the default browser.
 *
 * @param url - The URL to open
 * @returns Promise resolving to OpenInAppResult
 */
export async function openInBrowser(url: string): Promise<OpenInAppResult> {
  try {
    // Use child_process to open the URL
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    // Determine the command based on platform
    const platform = process.platform
    let command: string

    if (platform === 'darwin') {
      command = `open "${url}"`
    } else if (platform === 'win32') {
      command = `start "" "${url}"`
    } else {
      command = `xdg-open "${url}"`
    }

    await execAsync(command)

    return {
      success: true,
      message: `Opened ${url} in browser`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Failed to open in browser: ${errorMessage}`,
    }
  }
}

/**
 * Result of a tag operation.
 */
export interface TagOperationResult {
  success: boolean
  message: string
  tags?: string[]
}

/**
 * Adds a tag to a project.
 *
 * This server action:
 * 1. Adds the specified tag to the project's tag list
 * 2. Persists the tag to the storage file
 * 3. Revalidates the dashboard cache to show updated tags
 *
 * @param projectId - The unique identifier of the project
 * @param tag - The tag string to add
 * @returns Promise resolving to TagOperationResult with updated tag list
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client'
 * import { addProjectTag } from '@/lib/actions'
 *
 * function AddTagButton({ projectId, tag }: { projectId: string; tag: string }) {
 *   const handleAddTag = async () => {
 *     const result = await addProjectTag(projectId, tag)
 *     if (!result.success) {
 *       console.error(result.message)
 *     }
 *   }
 *   return <button onClick={handleAddTag}>Add Tag</button>
 * }
 * ```
 */
export async function addProjectTag(
  projectId: string,
  tag: string
): Promise<TagOperationResult> {
  try {
    const { addTagToProject, getProjectTags } = await import('./tag-storage')

    // Add the tag to the project
    await addTagToProject(projectId, tag)

    // Get updated tags
    const updatedTags = await getProjectTags(projectId)

    // Revalidate the dashboard pages
    revalidatePath('/')
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)

    return {
      success: true,
      message: `Tag "${tag}" added to project`,
      tags: updatedTags,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Failed to add tag: ${errorMessage}`,
    }
  }
}

/**
 * Removes a tag from a project.
 *
 * This server action:
 * 1. Removes the specified tag from the project's tag list
 * 2. Persists the change to the storage file
 * 3. Revalidates the dashboard cache to show updated tags
 *
 * @param projectId - The unique identifier of the project
 * @param tag - The tag string to remove
 * @returns Promise resolving to TagOperationResult with updated tag list
 *
 * @example
 * ```tsx
 * // In a client component
 * 'use client'
 * import { removeProjectTag } from '@/lib/actions'
 *
 * function RemoveTagButton({ projectId, tag }: { projectId: string; tag: string }) {
 *   const handleRemoveTag = async () => {
 *     const result = await removeProjectTag(projectId, tag)
 *     if (!result.success) {
 *       console.error(result.message)
 *     }
 *   }
 *   return <button onClick={handleRemoveTag}>Remove Tag</button>
 * }
 * ```
 */
export async function removeProjectTag(
  projectId: string,
  tag: string
): Promise<TagOperationResult> {
  try {
    const { removeTagFromProject, getProjectTags } = await import('./tag-storage')

    // Remove the tag from the project
    await removeTagFromProject(projectId, tag)

    // Get updated tags
    const updatedTags = await getProjectTags(projectId)

    // Revalidate the dashboard pages
    revalidatePath('/')
    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)

    return {
      success: true,
      message: `Tag "${tag}" removed from project`,
      tags: updatedTags,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Failed to remove tag: ${errorMessage}`,
    }
  }
}
