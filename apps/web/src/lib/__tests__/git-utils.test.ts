import { describe, it, expect, vi } from 'vitest'
import { determineProjectStatus, getGitStatusSummary } from '../git-utils'
import type { GitInfo } from '@organizeme/shared/types/project'

function makeGitInfo(overrides: Partial<GitInfo> = {}): GitInfo {
  return {
    branch: 'main',
    isDirty: false,
    uncommittedChanges: 0,
    aheadBy: 0,
    behindBy: 0,
    lastCommitDate: new Date(),
    lastCommitMessage: 'initial commit',
    ...overrides,
  }
}

describe('determineProjectStatus', () => {
  it('returns dirty when git info says dirty', () => {
    const gitInfo = makeGitInfo({ isDirty: true })
    expect(determineProjectStatus(gitInfo, new Date())).toBe('dirty')
  })

  it('returns active for recent commit (within 7 days)', () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 3)
    const gitInfo = makeGitInfo({ lastCommitDate: recent })
    expect(determineProjectStatus(gitInfo, new Date())).toBe('active')
  })

  it('returns stale for old commit (>30 days)', () => {
    const old = new Date()
    old.setDate(old.getDate() - 60)
    const gitInfo = makeGitInfo({ lastCommitDate: old })
    expect(determineProjectStatus(gitInfo, new Date())).toBe('stale')
  })

  it('returns clean for medium age commit (8-30 days)', () => {
    const medium = new Date()
    medium.setDate(medium.getDate() - 15)
    const gitInfo = makeGitInfo({ lastCommitDate: medium })
    expect(determineProjectStatus(gitInfo, new Date())).toBe('clean')
  })

  it('falls back to lastModified when no lastCommitDate', () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 3)
    const gitInfo = makeGitInfo({ lastCommitDate: undefined })
    expect(determineProjectStatus(gitInfo, recent)).toBe('active')
  })

  it('returns active for recent lastModified without git info', () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 3)
    expect(determineProjectStatus(undefined, recent)).toBe('active')
  })

  it('returns stale for old lastModified without git info', () => {
    const old = new Date()
    old.setDate(old.getDate() - 60)
    expect(determineProjectStatus(undefined, old)).toBe('stale')
  })

  it('returns unknown for medium lastModified without git info', () => {
    const medium = new Date()
    medium.setDate(medium.getDate() - 15)
    expect(determineProjectStatus(undefined, medium)).toBe('unknown')
  })

  it('boundary: just under 7 days returns active', () => {
    const now = new Date()
    const boundary = new Date(now.getTime() - 6.9 * 24 * 60 * 60 * 1000)
    const gitInfo = makeGitInfo({ lastCommitDate: boundary })
    expect(determineProjectStatus(gitInfo, now)).toBe('active')
  })

  it('dirty takes precedence over date-based status', () => {
    const old = new Date()
    old.setDate(old.getDate() - 60)
    const gitInfo = makeGitInfo({ isDirty: true, lastCommitDate: old })
    expect(determineProjectStatus(gitInfo, new Date())).toBe('dirty')
  })
})

describe('getGitStatusSummary', () => {
  it('shows branch and clean for clean repo', () => {
    const gitInfo = makeGitInfo({ branch: 'main' })
    expect(getGitStatusSummary(gitInfo)).toBe('main - clean')
  })

  it('shows singular uncommitted change', () => {
    const gitInfo = makeGitInfo({ isDirty: true, uncommittedChanges: 1 })
    expect(getGitStatusSummary(gitInfo)).toBe('main - 1 uncommitted change')
  })

  it('shows plural uncommitted changes', () => {
    const gitInfo = makeGitInfo({ isDirty: true, uncommittedChanges: 5 })
    expect(getGitStatusSummary(gitInfo)).toBe('main - 5 uncommitted changes')
  })

  it('shows ahead count', () => {
    const gitInfo = makeGitInfo({ aheadBy: 3 })
    expect(getGitStatusSummary(gitInfo)).toBe('main - clean - 3 ahead')
  })

  it('shows behind count', () => {
    const gitInfo = makeGitInfo({ behindBy: 2 })
    expect(getGitStatusSummary(gitInfo)).toBe('main - clean - 2 behind')
  })

  it('shows all parts together', () => {
    const gitInfo = makeGitInfo({
      branch: 'feature',
      isDirty: true,
      uncommittedChanges: 3,
      aheadBy: 1,
      behindBy: 2,
    })
    expect(getGitStatusSummary(gitInfo)).toBe('feature - 3 uncommitted changes - 1 ahead - 2 behind')
  })
})
