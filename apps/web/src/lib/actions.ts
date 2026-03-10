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
import type { ProjectListResponse } from '@organizeme/shared/types/project'

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

/**
 * Gets all unique tags across all projects.
 *
 * This server action wraps the tag-storage getAllTags function
 * so it can be called from client components via the DataProvider.
 *
 * @returns Promise resolving to array of unique tag strings
 */
export async function getAllTags(): Promise<string[]> {
  const { getAllTags: getAllTagsFromStorage } = await import('./tag-storage')
  return getAllTagsFromStorage()
}

/**
 * Gets notes for a project.
 */
export async function getProjectNotes(projectId: string): Promise<string> {
  const { getProjectNotes: getNotes } = await import('./note-storage')
  return getNotes(projectId)
}

/**
 * Saves notes for a project. Returns success/failure result.
 */
export async function saveProjectNotes(
  projectId: string,
  notes: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { saveProjectNotes: saveNotes } = await import('./note-storage')
    await saveNotes(projectId, notes)

    revalidatePath(`/projects/${projectId}`)

    return {
      success: true,
      message: 'Notes saved',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: `Failed to save notes: ${errorMessage}`,
    }
  }
}

/**
 * Result type for app settings operations.
 */
export interface AppSettingsResult {
  projectsPath: string
}

/**
 * Gets the current app settings from ~/.organizeme/config.json.
 *
 * @returns Promise resolving to AppSettingsResult
 */
export async function getAppSettings(): Promise<AppSettingsResult> {
  const { readFile } = await import('fs/promises')
  const { join } = await import('path')
  const { homedir } = await import('os')

  const configFile = join(homedir(), '.organizeme', 'config.json')

  try {
    const content = await readFile(configFile, 'utf-8')
    const data = JSON.parse(content) as Record<string, unknown>
    return {
      projectsPath: typeof data.projectsPath === 'string' ? data.projectsPath : '',
    }
  } catch {
    return { projectsPath: '' }
  }
}

/**
 * Updates app settings in ~/.organizeme/config.json.
 *
 * @param updates - Partial settings to merge
 * @returns Promise resolving to updated AppSettingsResult
 */
export async function updateAppSettings(
  updates: Partial<AppSettingsResult>
): Promise<AppSettingsResult> {
  const { readFile, writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  const { homedir } = await import('os')

  const configDir = join(homedir(), '.organizeme')
  const configFile = join(configDir, 'config.json')

  // Read existing config
  let existing: Record<string, unknown> = {}
  try {
    const content = await readFile(configFile, 'utf-8')
    existing = JSON.parse(content) as Record<string, unknown>
  } catch {
    // File doesn't exist yet, start fresh
  }

  // Merge updates
  if (updates.projectsPath !== undefined) {
    existing.projectsPath = updates.projectsPath
  }

  // Write back
  await mkdir(configDir, { recursive: true })
  await writeFile(configFile, JSON.stringify(existing, null, 2), 'utf-8')

  // Revalidate since projects path may have changed
  revalidatePath('/')
  revalidatePath('/projects')

  return {
    projectsPath: typeof existing.projectsPath === 'string' ? existing.projectsPath : '',
  }
}

/**
 * Opens a native folder picker dialog and returns the selected path.
 *
 * Uses platform-specific commands:
 * - macOS: osascript with 'choose folder'
 * - Linux: zenity --file-selection --directory
 *
 * @returns Promise resolving to the selected folder path, or null if cancelled
 */
export async function browseForFolder(): Promise<string | null> {
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)

  const platform = process.platform

  try {
    let command: string

    if (platform === 'darwin') {
      command = `osascript -e 'POSIX path of (choose folder with prompt "Select Projects Folder")'`
    } else if (platform === 'win32') {
      command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Select Projects Folder'; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath } else { '' }"`
    } else {
      command = `zenity --file-selection --directory --title="Select Projects Folder" 2>/dev/null`
    }

    const { stdout } = await execAsync(command)
    const path = stdout.trim()
    return path.length > 0 ? path : null
  } catch {
    // User cancelled or command failed
    return null
  }
}
