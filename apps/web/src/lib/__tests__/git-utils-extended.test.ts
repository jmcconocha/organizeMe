import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock simple-git before importing the module
const mockCheckIsRepo = vi.fn()
const mockStatus = vi.fn()
const mockLog = vi.fn()
const mockGetRemotes = vi.fn()

vi.mock('simple-git', () => {
  return {
    default: () => ({
      checkIsRepo: mockCheckIsRepo,
      status: mockStatus,
      log: mockLog,
      getRemotes: mockGetRemotes,
    }),
  }
})

import { getGitStatus, isGitRepository, getGitRemoteUrl, enrichProjectsWithGitInfo } from '../git-utils'
import type { GitInfo, ProjectStatus } from '@organizeme/shared/types/project'

describe('isGitRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true for a Git repository', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    expect(await isGitRepository('/repo')).toBe(true)
  })

  it('returns false for a non-Git directory', async () => {
    mockCheckIsRepo.mockResolvedValue(false)
    expect(await isGitRepository('/not-repo')).toBe(false)
  })

  it('returns false when check throws', async () => {
    mockCheckIsRepo.mockRejectedValue(new Error('fail'))
    expect(await isGitRepository('/bad')).toBe(false)
  })
})

describe('getGitStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error for non-Git directory', async () => {
    mockCheckIsRepo.mockResolvedValue(false)
    const result = await getGitStatus('/not-repo')
    expect(result).toHaveProperty('error')
    expect(result.error).toContain('Not a Git repository')
  })

  it('returns gitInfo for a clean repo', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockResolvedValue({
      current: 'main',
      isClean: () => true,
      files: [],
      ahead: 0,
      behind: 0,
    })
    mockLog.mockResolvedValue({
      latest: {
        date: '2025-01-15T12:00:00Z',
        message: 'initial commit',
      },
    })

    const result = await getGitStatus('/repo')
    expect(result).toHaveProperty('gitInfo')
    expect(result.gitInfo!.branch).toBe('main')
    expect(result.gitInfo!.isDirty).toBe(false)
    expect(result.gitInfo!.uncommittedChanges).toBe(0)
    expect(result.gitInfo!.lastCommitMessage).toBe('initial commit')
  })

  it('returns gitInfo for a dirty repo', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockResolvedValue({
      current: 'feature-branch',
      isClean: () => false,
      files: [{ path: 'a.ts' }, { path: 'b.ts' }],
      ahead: 3,
      behind: 1,
    })
    mockLog.mockResolvedValue({
      latest: {
        date: '2025-01-15T12:00:00Z',
        message: 'wip',
      },
    })

    const result = await getGitStatus('/repo')
    expect(result.gitInfo!.isDirty).toBe(true)
    expect(result.gitInfo!.uncommittedChanges).toBe(2)
    expect(result.gitInfo!.aheadBy).toBe(3)
    expect(result.gitInfo!.behindBy).toBe(1)
  })

  it('handles missing current branch', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockResolvedValue({
      current: null,
      isClean: () => true,
      files: [],
      ahead: 0,
      behind: 0,
    })
    mockLog.mockResolvedValue({ latest: null })

    const result = await getGitStatus('/repo')
    expect(result.gitInfo!.branch).toBe('HEAD')
  })

  it('handles no commits', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockResolvedValue({
      current: 'main',
      isClean: () => true,
      files: [],
      ahead: 0,
      behind: 0,
    })
    mockLog.mockResolvedValue({ latest: null })

    const result = await getGitStatus('/repo')
    expect(result.gitInfo!.lastCommitDate).toBeUndefined()
    expect(result.gitInfo!.lastCommitMessage).toBeUndefined()
  })

  it('returns error when git commands throw', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockRejectedValue(new Error('git crashed'))
    mockLog.mockRejectedValue(new Error('git crashed'))

    const result = await getGitStatus('/repo')
    expect(result).toHaveProperty('error')
    expect(result.error).toContain('Failed to get Git status')
  })
})

describe('getGitRemoteUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for non-Git directory', async () => {
    mockCheckIsRepo.mockResolvedValue(false)
    const result = await getGitRemoteUrl('/not-repo')
    expect(result.url).toBeNull()
  })

  it('returns HTTPS URL from origin remote', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockGetRemotes.mockResolvedValue([
      { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git' } },
    ])

    const result = await getGitRemoteUrl('/repo')
    expect(result.url).toBe('https://github.com/user/repo')
  })

  it('converts SSH URL to HTTPS', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockGetRemotes.mockResolvedValue([
      { name: 'origin', refs: { fetch: 'git@github.com:user/repo.git' } },
    ])

    const result = await getGitRemoteUrl('/repo')
    expect(result.url).toBe('https://github.com/user/repo')
  })

  it('returns null when no remotes exist', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockGetRemotes.mockResolvedValue([])

    const result = await getGitRemoteUrl('/repo')
    expect(result.url).toBeNull()
  })

  it('falls back to first remote if no origin', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockGetRemotes.mockResolvedValue([
      { name: 'upstream', refs: { fetch: 'https://github.com/org/repo.git' } },
    ])

    const result = await getGitRemoteUrl('/repo')
    expect(result.url).toBe('https://github.com/org/repo')
  })

  it('handles errors gracefully', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockGetRemotes.mockRejectedValue(new Error('network failure'))

    const result = await getGitRemoteUrl('/repo')
    expect(result.url).toBeNull()
    expect(result.error).toContain('Failed to get remote URL')
  })
})

describe('enrichProjectsWithGitInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds gitInfo to projects that are git repos', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockResolvedValue({
      current: 'main',
      isClean: () => false,
      files: [{ path: 'a.ts' }],
      ahead: 0,
      behind: 0,
    })
    mockLog.mockResolvedValue({
      latest: {
        date: new Date().toISOString(),
        message: 'latest',
      },
    })

    const projects = [{
      path: '/repo',
      status: 'unknown' as ProjectStatus,
      gitInfo: undefined as GitInfo | undefined,
    }]

    const enriched = await enrichProjectsWithGitInfo(projects)
    expect(enriched[0].gitInfo).toBeDefined()
    expect(enriched[0].gitInfo!.branch).toBe('main')
    expect(enriched[0].status).toBe('dirty')
  })

  it('leaves projects unchanged when not a git repo', async () => {
    mockCheckIsRepo.mockResolvedValue(false)

    const projects = [{
      path: '/not-repo',
      status: 'unknown' as ProjectStatus,
      gitInfo: undefined as GitInfo | undefined,
    }]

    const enriched = await enrichProjectsWithGitInfo(projects)
    expect(enriched[0].gitInfo).toBeUndefined()
    expect(enriched[0].status).toBe('unknown')
  })

  it('handles multiple projects in parallel', async () => {
    mockCheckIsRepo.mockResolvedValue(true)
    mockStatus.mockResolvedValue({
      current: 'main',
      isClean: () => true,
      files: [],
      ahead: 0,
      behind: 0,
    })
    mockLog.mockResolvedValue({
      latest: {
        date: new Date().toISOString(),
        message: 'commit',
      },
    })

    const projects = [
      { path: '/repo1', status: 'unknown' as ProjectStatus, gitInfo: undefined as GitInfo | undefined },
      { path: '/repo2', status: 'unknown' as ProjectStatus, gitInfo: undefined as GitInfo | undefined },
    ]

    const enriched = await enrichProjectsWithGitInfo(projects)
    expect(enriched).toHaveLength(2)
    expect(enriched[0].gitInfo).toBeDefined()
    expect(enriched[1].gitInfo).toBeDefined()
  })
})
