/**
 * API Route: GET /api/projects
 *
 * Fetches all projects from the configured projects directory
 * with their status and Git information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { scanProjects, filterSuccessfulScans, filterScanErrors } from '@/lib/project-scanner'
import { enrichProjectsWithGitInfo } from '@/lib/git-utils'
import type { ProjectListResponse, ProjectErrorResponse } from '@/types/project'

/**
 * GET /api/projects
 *
 * Returns a list of all projects found in the configured projects directory.
 * Each project includes basic metadata and Git status information where available.
 *
 * @returns ProjectListResponse with array of projects
 *
 * @example Response:
 * ```json
 * {
 *   "projects": [
 *     {
 *       "id": "my-project",
 *       "name": "my-project",
 *       "path": "/Users/dev/Documents/Projects/my-project",
 *       "status": "active",
 *       "lastModified": "2024-01-15T10:30:00.000Z",
 *       "hasPackageJson": true,
 *       "hasReadme": true,
 *       "gitInfo": {
 *         "branch": "main",
 *         "isDirty": false,
 *         "uncommittedChanges": 0,
 *         "aheadBy": 0,
 *         "behindBy": 0
 *       }
 *     }
 *   ],
 *   "total": 1,
 *   "scannedAt": "2024-01-15T12:00:00.000Z"
 * }
 * ```
 */
export async function GET(_request: NextRequest): Promise<NextResponse<ProjectListResponse | ProjectErrorResponse>> {
  try {
    // Scan the projects directory
    const scanResults = await scanProjects()

    // Check for fatal scan errors (e.g., directory not accessible)
    const errors = filterScanErrors(scanResults)
    if (errors.length > 0 && filterSuccessfulScans(scanResults).length === 0) {
      // All scans failed - return error response
      return NextResponse.json(
        {
          error: 'Failed to scan projects directory',
          code: 'SCAN_FAILED',
          details: errors.map(e => e.error).join('; '),
        } satisfies ProjectErrorResponse,
        { status: 500 }
      )
    }

    // Get successfully scanned projects
    const projects = filterSuccessfulScans(scanResults)

    // Enrich projects with Git information
    const enrichedProjects = await enrichProjectsWithGitInfo(projects)

    // Sort projects by last modified date (most recent first)
    enrichedProjects.sort((a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )

    const response: ProjectListResponse = {
      projects: enrichedProjects,
      total: enrichedProjects.length,
      scannedAt: new Date(),
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      } satisfies ProjectErrorResponse,
      { status: 500 }
    )
  }
}
