/**
 * Git Utilities Module
 *
 * This module provides utilities for extracting Git status and metadata
 * from project directories using the simple-git library.
 */

import simpleGit, { type SimpleGit, type StatusResult, type LogResult } from 'simple-git'
import type { GitInfo, ProjectStatus } from '@/types/project'

/**
 * Result of getting Git status from a directory.
 */
export interface GitStatusResult {
  gitInfo: GitInfo
  error?: undefined
}

/**
 * Error result when Git status extraction fails.
 */
export interface GitStatusError {
  gitInfo?: undefined
  error: string
}

/**
 * Union type for Git status results.
 */
export type GetGitStatusResult = GitStatusResult | GitStatusError

/**
 * Checks if a directory is a Git repository.
 *
 * @param projectPath - Path to the directory to check
 * @returns Promise resolving to true if the directory is a Git repository
 */
export async function isGitRepository(projectPath: string): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(projectPath)
    return await git.checkIsRepo()
  } catch {
    return false
  }
}

/**
 * Extracts Git status and metadata from a project directory.
 *
 * This function retrieves comprehensive Git information including:
 * - Current branch name
 * - Working directory dirty state
 * - Number of uncommitted changes
 * - Ahead/behind counts relative to remote
 * - Last commit details
 *
 * @param projectPath - Path to the Git repository
 * @returns Promise resolving to GitInfo object or null if not a Git repository
 *
 * @example
 * ```typescript
 * const result = await getGitStatus('/path/to/project')
 * if (result.gitInfo) {
 *   console.log(`Branch: ${result.gitInfo.branch}`)
 *   console.log(`Dirty: ${result.gitInfo.isDirty}`)
 * }
 * ```
 */
export async function getGitStatus(projectPath: string): Promise<GetGitStatusResult> {
  try {
    const git: SimpleGit = simpleGit(projectPath)

    // Always check if it's a repo first
    const isRepo = await git.checkIsRepo()
    if (!isRepo) {
      return {
        error: 'Not a Git repository',
      }
    }

    // Fetch status and log in parallel for performance
    const [status, log]: [StatusResult, LogResult] = await Promise.all([
      git.status(),
      git.log({ maxCount: 1 }),
    ])

    // Extract last commit information
    const lastCommit = log.latest
    const lastCommitDate = lastCommit?.date ? new Date(lastCommit.date) : undefined
    const lastCommitMessage = lastCommit?.message

    const gitInfo: GitInfo = {
      branch: status.current || 'HEAD',
      isDirty: !status.isClean(),
      uncommittedChanges: status.files.length,
      aheadBy: status.ahead,
      behindBy: status.behind,
      lastCommitDate,
      lastCommitMessage,
    }

    return { gitInfo }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      error: `Failed to get Git status: ${errorMessage}`,
    }
  }
}

/**
 * Determines the project status based on Git information and last modified date.
 *
 * Status logic:
 * - 'dirty': Has uncommitted changes
 * - 'clean': Git working directory is clean
 * - 'active': Recent activity (within last 7 days)
 * - 'stale': No activity for more than 30 days
 * - 'unknown': Cannot determine status
 *
 * @param gitInfo - Git information from the repository (optional)
 * @param lastModified - Last modified date of the project
 * @returns Computed project status
 */
export function determineProjectStatus(
  gitInfo: GitInfo | undefined,
  lastModified: Date
): ProjectStatus {
  // If we have Git info, prioritize dirty/clean status
  if (gitInfo) {
    if (gitInfo.isDirty) {
      return 'dirty'
    }

    // Check activity based on last commit date
    const referenceDate = gitInfo.lastCommitDate || lastModified
    const now = new Date()
    const daysSinceActivity = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceActivity <= 7) {
      return 'active'
    } else if (daysSinceActivity > 30) {
      return 'stale'
    }

    return 'clean'
  }

  // No Git info - use lastModified to determine status
  const now = new Date()
  const daysSinceModified = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceModified <= 7) {
    return 'active'
  } else if (daysSinceModified > 30) {
    return 'stale'
  }

  return 'unknown'
}

/**
 * Gets a human-readable summary of the Git status.
 *
 * @param gitInfo - Git information from the repository
 * @returns Human-readable status string
 *
 * @example
 * ```typescript
 * const summary = getGitStatusSummary(gitInfo)
 * // "main - 3 uncommitted changes, 2 ahead"
 * ```
 */
export function getGitStatusSummary(gitInfo: GitInfo): string {
  const parts: string[] = [gitInfo.branch]

  if (gitInfo.isDirty) {
    const changes = gitInfo.uncommittedChanges === 1
      ? '1 uncommitted change'
      : `${gitInfo.uncommittedChanges} uncommitted changes`
    parts.push(changes)
  } else {
    parts.push('clean')
  }

  if (gitInfo.aheadBy > 0) {
    parts.push(`${gitInfo.aheadBy} ahead`)
  }

  if (gitInfo.behindBy > 0) {
    parts.push(`${gitInfo.behindBy} behind`)
  }

  return parts.join(' - ')
}

/**
 * Enriches a list of projects with Git information.
 *
 * This utility function takes an array of projects and adds Git information
 * to each project that is a Git repository. Non-Git projects are left unchanged.
 *
 * @param projects - Array of projects to enrich
 * @returns Promise resolving to projects with Git information added
 */
export async function enrichProjectsWithGitInfo<T extends { path: string; gitInfo?: GitInfo; status: ProjectStatus }>(
  projects: T[]
): Promise<T[]> {
  const enrichedProjects = await Promise.all(
    projects.map(async (project) => {
      const result = await getGitStatus(project.path)

      if (result.gitInfo) {
        const status = determineProjectStatus(result.gitInfo, new Date())
        return {
          ...project,
          gitInfo: result.gitInfo,
          status,
        }
      }

      return project
    })
  )

  return enrichedProjects
}
