import { describe, it, expect, beforeEach, vi } from 'vitest'
import { filterSuccessfulScans, filterScanErrors } from '../project-scanner'
import type { ScanResult } from '../project-scanner'
import type { Project } from '@organizeme/shared/types/project'

function makeProject(name: string): Project {
  return {
    id: name.toLowerCase(),
    name,
    path: `/projects/${name}`,
    status: 'active',
    lastModified: new Date('2025-01-15'),
    hasPackageJson: true,
    hasReadme: true,
  }
}

describe('filterSuccessfulScans', () => {
  it('returns only successful project scans', () => {
    const results: ScanResult[] = [
      { project: makeProject('Alpha') },
      { error: 'Failed', path: '/bad' },
      { project: makeProject('Beta') },
    ]
    const projects = filterSuccessfulScans(results)
    expect(projects).toHaveLength(2)
    expect(projects.map(p => p.name)).toEqual(['Alpha', 'Beta'])
  })

  it('returns empty array when all are errors', () => {
    const results: ScanResult[] = [
      { error: 'Failed 1', path: '/bad1' },
      { error: 'Failed 2', path: '/bad2' },
    ]
    expect(filterSuccessfulScans(results)).toEqual([])
  })

  it('handles empty input', () => {
    expect(filterSuccessfulScans([])).toEqual([])
  })
})

describe('filterScanErrors', () => {
  it('returns only error results', () => {
    const results: ScanResult[] = [
      { project: makeProject('Alpha') },
      { error: 'Failed', path: '/bad' },
      { project: makeProject('Beta') },
    ]
    const errors = filterScanErrors(results)
    expect(errors).toHaveLength(1)
    expect(errors[0].error).toBe('Failed')
    expect(errors[0].path).toBe('/bad')
  })

  it('returns empty array when all are successes', () => {
    const results: ScanResult[] = [
      { project: makeProject('Alpha') },
    ]
    expect(filterScanErrors(results)).toEqual([])
  })

  it('handles empty input', () => {
    expect(filterScanErrors([])).toEqual([])
  })
})
