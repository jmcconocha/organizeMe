/**
 * Project Scanner Module
 *
 * This module provides file system scanning utilities for discovering
 * and extracting metadata from development projects in a directory.
 */

import { readdir, stat, access } from 'fs/promises'
import { join } from 'path'
import type { Project, ProjectStatus } from '@organizeme/shared/types/project'
import { getProjectTags } from '@/lib/tag-storage'

/**
 * Directories to ignore when scanning for projects.
 * These are typically system or tool-generated directories.
 */
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.cache',
  '.pnpm',
  'dist',
  'build',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
  '.idea',
  '.vscode',
])

/**
 * Result of scanning a single project directory.
 */
export interface ProjectScanResult {
  project: Project
  error?: undefined
}

/**
 * Error result when a project scan fails.
 */
export interface ProjectScanError {
  project?: undefined
  error: string
  path: string
}

/**
 * Union type for scan results.
 */
export type ScanResult = ProjectScanResult | ProjectScanError

/**
 * Options for the scanDirectory function.
 */
export interface ScanOptions {
  /** Maximum depth to scan for projects (default: 1) */
  maxDepth?: number
  /** Include hidden directories (starting with .) in results (default: false) */
  includeHidden?: boolean
}

/**
 * Checks if a file exists at the given path.
 *
 * @param filePath - Path to check
 * @returns Promise resolving to true if file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Determines if a directory is a valid project based on common indicators.
 * A valid project typically has at least one of:
 * - package.json (Node.js project)
 * - .git directory (Git repository)
 * - README file
 * - pyproject.toml (Python project)
 * - Cargo.toml (Rust project)
 * - go.mod (Go project)
 *
 * @param dirPath - Full path to the directory
 * @returns Promise resolving to true if the directory appears to be a project
 */
async function isProjectDirectory(dirPath: string): Promise<boolean> {
  const projectIndicators = [
    'package.json',
    '.git',
    'README.md',
    'README.txt',
    'README',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'Makefile',
  ]

  const checks = await Promise.all(
    projectIndicators.map(indicator => fileExists(join(dirPath, indicator)))
  )

  return checks.some(exists => exists)
}

/**
 * Creates a URL-safe identifier from a directory name.
 *
 * @param name - Directory name
 * @returns URL-safe identifier
 */
function createProjectId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Determines the initial status of a project based on last modified time.
 * This is a preliminary status; Git status will refine it later.
 *
 * @param lastModified - Date of last modification
 * @returns Preliminary project status
 */
function determineInitialStatus(lastModified: Date): ProjectStatus {
  const now = new Date()
  const daysSinceModified = (now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceModified <= 7) {
    return 'active'
  } else if (daysSinceModified <= 30) {
    return 'unknown' // Will be refined by Git status
  } else {
    return 'stale'
  }
}

/**
 * Extracts project description from package.json if available.
 *
 * @param dirPath - Full path to the directory
 * @returns Promise resolving to description or undefined
 */
async function getProjectDescription(dirPath: string): Promise<string | undefined> {
  const packageJsonPath = join(dirPath, 'package.json')

  try {
    const hasPackageJson = await fileExists(packageJsonPath)
    if (!hasPackageJson) return undefined

    // Dynamic import to read JSON file
    const { readFile } = await import('fs/promises')
    const content = await readFile(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(content) as { description?: string }

    return packageJson.description
  } catch {
    return undefined
  }
}

/**
 * Scans a single directory and creates a Project object.
 *
 * @param dirPath - Full path to the project directory
 * @param name - Name of the project (directory name)
 * @returns Promise resolving to a Project object
 */
async function scanProject(dirPath: string, name: string): Promise<Project> {
  const stats = await stat(dirPath)
  const projectId = createProjectId(name)

  // Check for README files (any variant)
  const readmeChecks = await Promise.all([
    fileExists(join(dirPath, 'README.md')),
    fileExists(join(dirPath, 'README.txt')),
    fileExists(join(dirPath, 'README')),
  ])
  const hasReadmeFile = readmeChecks.some(exists => exists)

  const [hasPackageJson, description, tags] = await Promise.all([
    fileExists(join(dirPath, 'package.json')),
    getProjectDescription(dirPath),
    getProjectTags(projectId),
  ])

  return {
    id: projectId,
    name,
    path: dirPath,
    description,
    status: determineInitialStatus(stats.mtime),
    lastModified: stats.mtime,
    hasPackageJson,
    hasReadme: hasReadmeFile,
    // gitInfo will be populated by git-utils.ts
    gitInfo: undefined,
    tags,
  }
}

/**
 * Scans a directory for development projects.
 *
 * This function reads the specified directory and identifies subdirectories
 * that appear to be development projects. It extracts basic metadata from
 * each project including name, path, and file indicators.
 *
 * @param projectsPath - Path to the directory containing projects
 * @param options - Scan options (optional)
 * @returns Promise resolving to array of scan results
 *
 * @example
 * ```typescript
 * const results = await scanDirectory('/Users/dev/Documents/Projects')
 * const projects = results
 *   .filter((r): r is ProjectScanResult => 'project' in r)
 *   .map(r => r.project)
 * ```
 */
export async function scanDirectory(
  projectsPath: string,
  options: ScanOptions = {}
): Promise<ScanResult[]> {
  const { includeHidden = false } = options

  // Verify the directory exists and is accessible
  try {
    const stats = await stat(projectsPath)
    if (!stats.isDirectory()) {
      console.error(`[OrganizeMe] Projects path is not a directory: ${projectsPath}`)
      return [{
        error: `Path is not a directory: ${projectsPath}`,
        path: projectsPath,
      }]
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[OrganizeMe] Cannot access projects directory: ${errorMessage}`)
    return [{
      error: `Cannot access directory: ${errorMessage}`,
      path: projectsPath,
    }]
  }

  // Read directory contents
  let entries
  try {
    entries = await readdir(projectsPath, { withFileTypes: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[OrganizeMe] Failed to read projects directory: ${errorMessage}`)
    return [{
      error: `Failed to read directory: ${errorMessage}`,
      path: projectsPath,
    }]
  }

  // Filter to only directories
  const directories = entries.filter(entry => {
    if (!entry.isDirectory()) return false
    if (IGNORED_DIRECTORIES.has(entry.name)) return false
    if (!includeHidden && entry.name.startsWith('.')) return false
    return true
  })

  // Scan each directory for project indicators
  const results: ScanResult[] = await Promise.all(
    directories.map(async (dir): Promise<ScanResult> => {
      const fullPath = join(projectsPath, dir.name)

      try {
        const isProject = await isProjectDirectory(fullPath)

        if (!isProject) {
          // Skip directories that don't look like projects
          // Return a project anyway but with unknown status
          const project = await scanProject(fullPath, dir.name)
          project.status = 'unknown'
          return { project }
        }

        const project = await scanProject(fullPath, dir.name)
        return { project }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[OrganizeMe] Failed to scan project at ${fullPath}: ${errorMessage}`)
        return {
          error: `Failed to scan project: ${errorMessage}`,
          path: fullPath,
        }
      }
    })
  )

  return results
}

/**
 * Gets the configured projects path.
 * Priority: config.json → PROJECTS_PATH env → default ~/Documents/Projects
 *
 * @returns The path to scan for projects
 */
export function getProjectsPath(): string {
  // Try reading from ~/.organizeme/config.json
  try {
    const { readFileSync } = require('fs')
    const { homedir } = require('os')
    const configFile = join(homedir(), '.organizeme', 'config.json')
    const content = readFileSync(configFile, 'utf-8')
    const data = JSON.parse(content) as Record<string, unknown>
    if (typeof data.projectsPath === 'string' && data.projectsPath.length > 0) {
      return data.projectsPath
    }
  } catch {
    // Config file doesn't exist or is invalid, continue to fallbacks
  }

  return process.env.PROJECTS_PATH || join(process.env.HOME || '', 'Documents', 'Projects')
}

/**
 * Convenience function to scan the configured projects directory.
 *
 * @param options - Scan options (optional)
 * @returns Promise resolving to array of scan results
 */
export async function scanProjects(options?: ScanOptions): Promise<ScanResult[]> {
  const projectsPath = getProjectsPath()
  return scanDirectory(projectsPath, options)
}

/**
 * Filters scan results to only successful project scans.
 *
 * @param results - Array of scan results
 * @returns Array of successfully scanned projects
 */
export function filterSuccessfulScans(results: ScanResult[]): Project[] {
  return results
    .filter((r): r is ProjectScanResult => 'project' in r && r.project !== undefined)
    .map(r => r.project)
}

/**
 * Filters scan results to only errors.
 *
 * @param results - Array of scan results
 * @returns Array of scan errors
 */
export function filterScanErrors(results: ScanResult[]): ProjectScanError[] {
  return results.filter((r): r is ProjectScanError => 'error' in r && r.error !== undefined)
}

/**
 * README file names to search for, in order of preference.
 */
const README_FILES = ['README.md', 'README.txt', 'README', 'readme.md', 'Readme.md']

/**
 * Maximum length of README content to return (to avoid huge payloads).
 */
const MAX_README_LENGTH = 50000

/**
 * Reads the README content from a project directory.
 *
 * This function searches for common README file variants and returns
 * the content of the first one found.
 *
 * @param projectPath - Full path to the project directory
 * @returns Promise resolving to README content or null if not found
 *
 * @example
 * ```typescript
 * const content = await getReadmeContent('/path/to/project')
 * if (content) {
 *   console.log(content)
 * }
 * ```
 */
export async function getReadmeContent(projectPath: string): Promise<string | null> {
  const { readFile } = await import('fs/promises')

  for (const fileName of README_FILES) {
    try {
      const filePath = join(projectPath, fileName)
      const exists = await fileExists(filePath)

      if (exists) {
        const content = await readFile(filePath, 'utf-8')
        // Truncate if too large
        if (content.length > MAX_README_LENGTH) {
          return content.slice(0, MAX_README_LENGTH) + '\n\n... (truncated)'
        }
        return content
      }
    } catch {
      // Continue to next file
      continue
    }
  }

  return null
}
