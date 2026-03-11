/**
 * Project Management Dashboard - Type Definitions
 *
 * This module defines the core TypeScript interfaces for project data,
 * Git information, and project status types.
 */

/**
 * Git-specific information extracted from a project repository.
 * This data is only available for projects that are Git repositories.
 */
export interface GitInfo {
  /** Current branch name */
  branch: string
  /** Whether the working directory has uncommitted changes */
  isDirty: boolean
  /** Number of files with uncommitted changes */
  uncommittedChanges: number
  /** Number of commits ahead of the remote tracking branch */
  aheadBy: number
  /** Number of commits behind the remote tracking branch */
  behindBy: number
  /** Date of the most recent commit */
  lastCommitDate?: Date
  /** Message of the most recent commit */
  lastCommitMessage?: string
}

/**
 * Status indicator for project health and activity.
 *
 * - 'active': Project has recent commits and ongoing activity
 * - 'stale': Project hasn't been modified in a while
 * - 'clean': Git working directory is clean with no uncommitted changes
 * - 'dirty': Git working directory has uncommitted changes
 * - 'unknown': Status cannot be determined (e.g., not a Git repo)
 */
export type ProjectStatus = 'active' | 'stale' | 'clean' | 'dirty' | 'unknown'

/**
 * Core project interface representing a development project.
 * This is the primary data structure used throughout the dashboard.
 */
export interface Project {
  /** URL-safe identifier derived from directory name */
  id: string
  /** Display name for the project */
  name: string
  /** Full filesystem path to the project directory */
  path: string
  /** Project description from package.json or README */
  description?: string
  /** Computed status based on Git state and activity */
  status: ProjectStatus
  /** Timestamp of the most recent file modification */
  lastModified: Date
  /** Git-specific data, undefined for non-Git projects */
  gitInfo?: GitInfo
  /** Whether the project contains a package.json file */
  hasPackageJson: boolean
  /** Whether the project contains a README file */
  hasReadme: boolean
  /** README file content for display in detail view */
  readmeContent?: string | null
  /** Remote repository URL (GitHub, GitLab, etc.) */
  gitRemoteUrl?: string | null
  /** Array of tags for categorizing and organizing projects */
  tags?: string[]
  /** User's personal notes about this project */
  notes?: string
  /** Error message if the project failed to scan */
  scanError?: string
}

/**
 * Lightweight project summary for list views.
 * Contains essential fields for at-a-glance display.
 */
export interface ProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  lastModified: Date
  hasGit: boolean
  branch?: string
  isDirty?: boolean
  /** Array of tags for categorizing and organizing projects */
  tags?: string[]
}

/**
 * API response wrapper for project list endpoints.
 */
export interface ProjectListResponse {
  projects: Project[]
  total: number
  scannedAt: Date
}

/**
 * API response wrapper for single project endpoint.
 */
export interface ProjectDetailResponse {
  project: Project
  fetchedAt: Date
}

/**
 * Error response structure for API endpoints.
 */
export interface ProjectErrorResponse {
  error: string
  code: string
  details?: string
}
