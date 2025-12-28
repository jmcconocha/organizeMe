# Specification: Project Management Dashboard

## Overview

Build a local development project management dashboard that provides a unified "single pane of glass" view for tracking all projects located in the user's documents/projects folder. The dashboard will display project completion states, highlight what needs to be done next, and provide quick navigation to project directories. This solves the user's pain point of difficulty determining project status across multiple concurrent development efforts.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature implementation - building an entirely new application from scratch. There are no existing systems to refactor or migrate; we are creating new functionality to address a specific user need for project visibility and management.

## Task Scope

### Services Involved
- **dashboard** (primary) - Next.js 15+ web application serving the project management UI
- **file-system** (integration) - Node.js fs module for scanning project directories
- **git-integration** (integration) - simple-git library for extracting Git status from projects

### This Task Will:
- [x] Create a Next.js 15+ application with App Router and TypeScript
- [x] Implement file system scanning of the documents/projects directory
- [x] Extract project metadata (name, description, Git status, last modified)
- [x] Build an at-a-glance dashboard view showing all projects with status indicators
- [x] Build a detail view for individual project deep-dives
- [x] Implement navigation buttons/links to open project directories
- [x] Add visual status indicators (badges) for project completion states

### Out of Scope:
- Cloud synchronization or remote project tracking
- Project editing capabilities (code editing, file modifications)
- Build/deployment automation
- Real-time collaborative features
- Mobile app version

## Service Context

### Dashboard (Next.js Application)

**Tech Stack:**
- Language: TypeScript
- Framework: Next.js 15+ with App Router
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui
- Key directories: `src/app/`, `src/components/`, `src/lib/`

**Entry Point:** `src/app/page.tsx`

**How to Run:**
```bash
npm run dev
```

**Port:** 3000

### File System Integration

**Tech Stack:**
- Language: TypeScript
- Module: Node.js fs/promises (built-in)
- Key functions: `readdir()`, `stat()`, `watch()`

**Usage:** Server-side only (API routes and Server Actions)

### Git Integration

**Tech Stack:**
- Language: TypeScript
- Library: simple-git
- Key functions: `status()`, `log()`, `branch()`, `checkIsRepo()`

**Usage:** Server-side only, requires system Git installation

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/app/page.tsx` | dashboard | Create main dashboard page with project grid/list |
| `src/app/projects/[id]/page.tsx` | dashboard | Create detail view for individual projects |
| `src/app/api/projects/route.ts` | dashboard | API endpoint for fetching all projects |
| `src/app/api/projects/[id]/route.ts` | dashboard | API endpoint for single project details |
| `src/lib/project-scanner.ts` | file-system | File system scanning logic |
| `src/lib/git-utils.ts` | git-integration | Git status extraction utilities |
| `src/types/project.ts` | dashboard | TypeScript interfaces for project data |
| `src/components/project-card.tsx` | dashboard | Reusable project card component |
| `src/components/project-table.tsx` | dashboard | Table view for project listing |
| `src/components/status-badge.tsx` | dashboard | Status indicator badge component |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| Next.js 15 Route Handler docs | API route structure with NextRequest/NextResponse |
| shadcn/ui Card component | Component composition pattern |
| simple-git examples | Git repository status extraction |

## Patterns to Follow

### API Route Pattern (Next.js 15+)

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- Use NextRequest and NextResponse types
- Always wrap in try/catch for error handling
- Return proper HTTP status codes

### Server Action Pattern

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function refreshProjects() {
  // Perform server-side operation
  await scanProjects()
  revalidatePath('/')
}
```

**Key Points:**
- Use 'use server' directive at top
- Use revalidatePath for cache updates
- Keep server-only logic in server actions

### File System Scanning Pattern

```typescript
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

async function scanDirectory(path: string) {
  const entries = await readdir(path, { withFileTypes: true })
  const directories = entries.filter(entry => entry.isDirectory())

  return Promise.all(
    directories.map(async (dir) => {
      const fullPath = join(path, dir.name)
      const stats = await stat(fullPath)
      return { name: dir.name, path: fullPath, modified: stats.mtime }
    })
  )
}
```

**Key Points:**
- Use promises-based fs API
- Filter for directories only when scanning projects
- Use withFileTypes option for efficient filtering

### Git Status Pattern

```typescript
import simpleGit from 'simple-git'

async function getGitStatus(projectPath: string) {
  const git = simpleGit(projectPath)

  // Always check if it's a repo first
  const isRepo = await git.checkIsRepo()
  if (!isRepo) return null

  const status = await git.status()
  const log = await git.log({ maxCount: 1 })

  return {
    branch: status.current,
    isDirty: !status.isClean(),
    uncommittedChanges: status.files.length,
    lastCommit: log.latest
  }
}
```

**Key Points:**
- Always call checkIsRepo() before Git operations
- Handle non-Git directories gracefully
- Extract meaningful status indicators

## Requirements

### Functional Requirements

1. **Project Discovery**
   - Description: Automatically scan the documents/projects directory and discover all project folders
   - Acceptance: Dashboard displays all subdirectories from ~/Documents/Projects

2. **At-a-Glance View**
   - Description: Show all projects in a grid or list with visual status indicators
   - Acceptance: User can see status of all projects without clicking into any project

3. **Project Status Detection**
   - Description: Determine project health from Git status, file changes, and metadata
   - Acceptance: Each project shows a status badge (active, stale, clean, dirty)

4. **Detail View**
   - Description: Click on a project to see detailed information including Git log, file structure, and recent activity
   - Acceptance: Detail page shows comprehensive project information

5. **Quick Navigation**
   - Description: Provide buttons/links to open project directories in Finder/file manager
   - Acceptance: Clicking "Open" button reveals project folder in system file manager

6. **Refresh Capability**
   - Description: Allow manual refresh of project statuses
   - Acceptance: Refresh button rescans all projects and updates display

### Edge Cases

1. **Non-Git Projects** - Show as valid projects without Git-specific indicators; display "No Git" badge
2. **Empty Directories** - Skip or show as "Empty" projects
3. **Inaccessible Directories** - Handle permission errors gracefully; show error state
4. **Missing Projects Folder** - Show friendly error message if documents/projects doesn't exist
5. **Very Large Project Count** - Implement pagination or virtualization for 100+ projects
6. **Long Project Names** - Truncate with ellipsis; show full name on hover

## Implementation Notes

### DO
- Follow the Next.js 15 App Router conventions for all routes
- Use shadcn/ui components for consistent UI (Button, Card, Table, Badge)
- Implement error boundaries for graceful error handling
- Use TypeScript strictly with proper interfaces
- Keep file system operations server-side only
- Cache project data with appropriate revalidation

### DON'T
- Don't use client-side fs operations (impossible in browser)
- Don't store sensitive paths in client-side code
- Don't poll file system too frequently (respect system resources)
- Don't ignore error states - always show meaningful feedback
- Don't use deprecated Next.js patterns (pages router, getServerSideProps)

## Development Environment

### Initial Setup

```bash
# Create Next.js application
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# Initialize shadcn/ui
npx shadcn@latest init

# Add required components
npx shadcn@latest add button card table badge separator tabs

# Install git library
npm install simple-git
```

### Start Services

```bash
npm run dev
```

### Service URLs
- Dashboard: http://localhost:3000
- API Projects: http://localhost:3000/api/projects
- API Project Detail: http://localhost:3000/api/projects/[id]

### Required Environment Variables
- `PROJECTS_PATH`: Path to projects directory (default: ~/Documents/Projects)

Create `.env.local`:
```
PROJECTS_PATH=/Users/jmcconocha/Documents/Projects
```

## Data Models

### Project Interface

```typescript
interface Project {
  id: string              // URL-safe identifier (directory name)
  name: string            // Display name
  path: string            // Full filesystem path
  description?: string    // From package.json or README
  status: ProjectStatus   // Computed status
  lastModified: Date      // Most recent file change
  gitInfo?: GitInfo       // Git-specific data (if repo)
  hasPackageJson: boolean // Node.js project indicator
  hasReadme: boolean      // Documentation indicator
}

type ProjectStatus = 'active' | 'stale' | 'clean' | 'dirty' | 'unknown'

interface GitInfo {
  branch: string
  isDirty: boolean
  uncommittedChanges: number
  aheadBy: number
  behindBy: number
  lastCommitDate?: Date
  lastCommitMessage?: string
}
```

## Success Criteria

The task is complete when:

1. [x] Dashboard loads at http://localhost:3000 showing all projects from ~/Documents/Projects
2. [x] Each project displays a status badge indicating its state
3. [x] Clicking a project navigates to a detail view with full project information
4. [x] "Open in Finder" button successfully opens the project directory
5. [x] Non-Git projects are handled gracefully without errors
6. [x] No console errors in browser or server
7. [x] TypeScript compiles without errors
8. [x] Existing tests pass (or new tests written and passing)
9. [x] Application is responsive and works on different screen sizes

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Project Scanner | `src/lib/__tests__/project-scanner.test.ts` | Correctly reads directory structure |
| Git Utils | `src/lib/__tests__/git-utils.test.ts` | Extracts Git status accurately |
| Status Badge | `src/components/__tests__/status-badge.test.tsx` | Renders correct badge for each status |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| API Projects Endpoint | dashboard ↔ file-system | Returns valid project list JSON |
| Project Detail API | dashboard ↔ git-integration | Returns complete project with Git info |
| Refresh Action | dashboard ↔ file-system | Revalidates and updates project list |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| View All Projects | 1. Load dashboard 2. Wait for projects | Grid shows all projects with badges |
| View Project Detail | 1. Click project card 2. Wait for load | Detail page shows Git info and metadata |
| Open Project Folder | 1. Click "Open in Finder" button | System file manager opens to project path |
| Refresh Projects | 1. Click refresh button 2. Wait for update | Project list updates with latest data |

### Browser Verification (if frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| Dashboard Home | `http://localhost:3000` | Projects grid loads, badges visible, responsive |
| Project Detail | `http://localhost:3000/projects/[id]` | Git info displayed, back button works |
| Error States | `http://localhost:3000` | Handles missing directory gracefully |

### API Verification
| Endpoint | Method | Expected Response |
|----------|--------|-------------------|
| `/api/projects` | GET | 200 with array of Project objects |
| `/api/projects/[id]` | GET | 200 with single Project object |
| `/api/projects/invalid` | GET | 404 with error message |

### QA Sign-off Requirements
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete
- [ ] API endpoints return correct data
- [ ] No regressions in existing functionality
- [ ] Code follows established patterns
- [ ] No security vulnerabilities introduced
- [ ] TypeScript has no compilation errors
- [ ] Application handles errors gracefully
