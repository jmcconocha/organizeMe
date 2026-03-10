import { describe, it, expect } from 'vitest'
import { getSortComparator, sortProjects, sortProjectsWithFavorites, SORT_LABELS } from '../sort-utils'
import type { Project } from '../../types/project'

function makeProject(overrides: Partial<Project> & { name: string }): Project {
  return {
    id: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    path: `/projects/${overrides.name}`,
    status: 'active',
    lastModified: new Date('2025-01-15'),
    hasPackageJson: true,
    hasReadme: true,
    ...overrides,
  }
}

const projectA = makeProject({ name: 'Alpha', lastModified: new Date('2025-03-01'), status: 'dirty' })
const projectB = makeProject({ name: 'Beta', lastModified: new Date('2025-02-01'), status: 'active' })
const projectC = makeProject({ name: 'Charlie', lastModified: new Date('2025-01-01'), status: 'stale' })

describe('SORT_LABELS', () => {
  it('has labels for all sort options', () => {
    expect(Object.keys(SORT_LABELS)).toEqual([
      'name-asc', 'name-desc', 'modified-newest', 'modified-oldest', 'status', 'type',
    ])
  })
})

describe('getSortComparator', () => {
  it('returns a function for each sort option', () => {
    const options = ['name-asc', 'name-desc', 'modified-newest', 'modified-oldest', 'status', 'type'] as const
    for (const option of options) {
      expect(typeof getSortComparator(option)).toBe('function')
    }
  })
})

describe('sortProjects', () => {
  const projects = [projectC, projectA, projectB]

  it('sorts by name ascending', () => {
    const sorted = sortProjects(projects, 'name-asc')
    expect(sorted.map(p => p.name)).toEqual(['Alpha', 'Beta', 'Charlie'])
  })

  it('sorts by name descending', () => {
    const sorted = sortProjects(projects, 'name-desc')
    expect(sorted.map(p => p.name)).toEqual(['Charlie', 'Beta', 'Alpha'])
  })

  it('sorts by modified newest first', () => {
    const sorted = sortProjects(projects, 'modified-newest')
    expect(sorted.map(p => p.name)).toEqual(['Alpha', 'Beta', 'Charlie'])
  })

  it('sorts by modified oldest first', () => {
    const sorted = sortProjects(projects, 'modified-oldest')
    expect(sorted.map(p => p.name)).toEqual(['Charlie', 'Beta', 'Alpha'])
  })

  it('sorts by status priority (dirty > active > stale > clean > unknown)', () => {
    const sorted = sortProjects(projects, 'status')
    expect(sorted.map(p => p.status)).toEqual(['dirty', 'active', 'stale'])
  })

  it('sorts by type (hasPackageJson + hasReadme first)', () => {
    const p1 = makeProject({ name: 'Full', hasPackageJson: true, hasReadme: true })
    const p2 = makeProject({ name: 'PkgOnly', hasPackageJson: true, hasReadme: false })
    const p3 = makeProject({ name: 'ReadmeOnly', hasPackageJson: false, hasReadme: true })
    const p4 = makeProject({ name: 'Empty', hasPackageJson: false, hasReadme: false })
    const sorted = sortProjects([p4, p2, p3, p1], 'type')
    expect(sorted.map(p => p.name)).toEqual(['Full', 'PkgOnly', 'ReadmeOnly', 'Empty'])
  })

  it('does not mutate the original array', () => {
    const original = [projectC, projectA, projectB]
    const originalCopy = [...original]
    sortProjects(original, 'name-asc')
    expect(original.map(p => p.name)).toEqual(originalCopy.map(p => p.name))
  })

  it('handles empty array', () => {
    expect(sortProjects([], 'name-asc')).toEqual([])
  })

  it('handles single item', () => {
    const sorted = sortProjects([projectA], 'name-asc')
    expect(sorted).toHaveLength(1)
    expect(sorted[0].name).toBe('Alpha')
  })

  it('uses name as tiebreaker for status sort', () => {
    const p1 = makeProject({ name: 'Zebra', status: 'active' })
    const p2 = makeProject({ name: 'Apple', status: 'active' })
    const sorted = sortProjects([p1, p2], 'status')
    expect(sorted.map(p => p.name)).toEqual(['Apple', 'Zebra'])
  })

  it('handles ISO string dates', () => {
    const p1 = makeProject({ name: 'A', lastModified: '2025-03-01T00:00:00Z' as unknown as Date })
    const p2 = makeProject({ name: 'B', lastModified: '2025-01-01T00:00:00Z' as unknown as Date })
    const sorted = sortProjects([p2, p1], 'modified-newest')
    expect(sorted.map(p => p.name)).toEqual(['A', 'B'])
  })
})

describe('sortProjectsWithFavorites', () => {
  const projects = [projectC, projectA, projectB]

  it('places favorites before non-favorites', () => {
    const favorites = new Set([projectC.id])
    const sorted = sortProjectsWithFavorites(projects, favorites, 'name-asc')
    expect(sorted[0].name).toBe('Charlie')
    expect(sorted.slice(1).map(p => p.name)).toEqual(['Alpha', 'Beta'])
  })

  it('sorts favorites and non-favorites independently', () => {
    const favorites = new Set([projectC.id, projectA.id])
    const sorted = sortProjectsWithFavorites(projects, favorites, 'name-asc')
    expect(sorted.map(p => p.name)).toEqual(['Alpha', 'Charlie', 'Beta'])
  })

  it('handles no favorites', () => {
    const sorted = sortProjectsWithFavorites(projects, new Set(), 'name-asc')
    expect(sorted.map(p => p.name)).toEqual(['Alpha', 'Beta', 'Charlie'])
  })

  it('handles all favorites', () => {
    const favorites = new Set(projects.map(p => p.id))
    const sorted = sortProjectsWithFavorites(projects, favorites, 'name-asc')
    expect(sorted.map(p => p.name)).toEqual(['Alpha', 'Beta', 'Charlie'])
  })
})
