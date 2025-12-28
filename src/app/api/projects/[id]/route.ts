/**
 * API Route: GET /api/projects/[id]
 *
 * Fetches a single project by ID with detailed status and Git information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { scanProjects, filterSuccessfulScans } from '@/lib/project-scanner'
import { getGitStatus, determineProjectStatus } from '@/lib/git-utils'
import type { Project, ProjectDetailResponse, ProjectErrorResponse } from '@/types/project'

/**
 * GET /api/projects/[id]
 *
 * Returns detailed information about a single project identified by its ID.
 * The ID corresponds to the URL-safe identifier derived from the project's directory name.
 *
 * @param request - The incoming request
 * @param params - Route parameters containing the project ID
 * @returns ProjectDetailResponse with the project details or error
 *
 * @example Response (200):
 * ```json
 * {
 *   "project": {
 *     "id": "my-project",
 *     "name": "my-project",
 *     "path": "/Users/dev/Documents/Projects/my-project",
 *     "status": "active",
 *     "lastModified": "2024-01-15T10:30:00.000Z",
 *     "hasPackageJson": true,
 *     "hasReadme": true,
 *     "gitInfo": {
 *       "branch": "main",
 *       "isDirty": false,
 *       "uncommittedChanges": 0,
 *       "aheadBy": 0,
 *       "behindBy": 0,
 *       "lastCommitDate": "2024-01-15T09:00:00.000Z",
 *       "lastCommitMessage": "feat: add new feature"
 *     }
 *   },
 *   "fetchedAt": "2024-01-15T12:00:00.000Z"
 * }
 * ```
 *
 * @example Response (404):
 * ```json
 * {
 *   "error": "Project not found",
 *   "code": "NOT_FOUND",
 *   "details": "No project found with ID: invalid-project"
 * }
 * ```
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProjectDetailResponse | ProjectErrorResponse>> {
  try {
    const { id } = await params

    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid project ID',
          code: 'INVALID_ID',
          details: 'Project ID must be a non-empty string',
        } satisfies ProjectErrorResponse,
        { status: 400 }
      )
    }

    // Scan all projects to find the matching one
    const scanResults = await scanProjects()
    const projects = filterSuccessfulScans(scanResults)

    // Find the project by ID
    const project = projects.find((p: Project) => p.id === id)

    if (!project) {
      return NextResponse.json(
        {
          error: 'Project not found',
          code: 'NOT_FOUND',
          details: `No project found with ID: ${id}`,
        } satisfies ProjectErrorResponse,
        { status: 404 }
      )
    }

    // Enrich with Git information
    const gitResult = await getGitStatus(project.path)

    if (gitResult.gitInfo) {
      project.gitInfo = gitResult.gitInfo
      project.status = determineProjectStatus(gitResult.gitInfo, project.lastModified)
    }

    const response: ProjectDetailResponse = {
      project,
      fetchedAt: new Date(),
    }

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to fetch project',
        code: 'INTERNAL_ERROR',
        details: errorMessage,
      } satisfies ProjectErrorResponse,
      { status: 500 }
    )
  }
}
