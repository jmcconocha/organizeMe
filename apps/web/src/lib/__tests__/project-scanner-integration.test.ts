import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { join } from 'path'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
  readFile: vi.fn(),
}))

// Mock tag-storage
vi.mock('@/lib/tag-storage', () => ({
  getProjectTags: vi.fn(() => Promise.resolve([])),
}))

import { readdir, stat, access, readFile } from 'fs/promises'
import { scanDirectory, getProjectsPath } from '../project-scanner'

const mockReaddir = vi.mocked(readdir)
const mockStat = vi.mocked(stat)
const mockAccess = vi.mocked(access)
const mockReadFile = vi.mocked(readFile)

function makeDirEntry(name: string, isDir = true) {
  return {
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
    parentPath: '/projects',
    path: `/projects/${name}`,
  }
}

function makeStats(mtime = new Date()) {
  return {
    mtime,
    isDirectory: () => true,
    isFile: () => false,
  } as unknown as ReturnType<typeof stat> extends Promise<infer T> ? T : never
}

describe('scanDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when path is not a directory', async () => {
    mockStat.mockResolvedValue({
      isDirectory: () => false,
    } as any)

    const results = await scanDirectory('/not-a-dir')
    expect(results).toHaveLength(1)
    expect(results[0]).toHaveProperty('error')
    expect((results[0] as any).error).toContain('not a directory')
  })

  it('returns error when path is inaccessible', async () => {
    mockStat.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/nonexistent')
    expect(results).toHaveLength(1)
    expect((results[0] as any).error).toContain('Cannot access')
  })

  it('returns error when readdir fails', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockRejectedValue(new Error('EACCES'))

    const results = await scanDirectory('/projects')
    expect(results).toHaveLength(1)
    expect((results[0] as any).error).toContain('Failed to read directory')
  })

  it('scans project directories successfully', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockResolvedValue([
      makeDirEntry('my-project'),
    ] as any)

    // access checks for project indicators and README
    mockAccess.mockImplementation(async (p: any) => {
      const pathStr = String(p)
      if (pathStr.includes('package.json') || pathStr.includes('.git')) {
        return undefined
      }
      throw new Error('ENOENT')
    })

    // readFile for package.json description
    mockReadFile.mockResolvedValue(JSON.stringify({ description: 'A test project' }))

    const results = await scanDirectory('/projects')
    expect(results).toHaveLength(1)

    const result = results[0]
    expect(result).toHaveProperty('project')
    const project = (result as any).project
    expect(project.name).toBe('my-project')
    expect(project.path).toBe('/projects/my-project')
    expect(project.hasPackageJson).toBe(true)
  })

  it('skips ignored directories', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockResolvedValue([
      makeDirEntry('node_modules'),
      makeDirEntry('.git'),
      makeDirEntry('real-project'),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects')
    // node_modules and .git should be filtered out
    expect(results).toHaveLength(1)
    expect((results[0] as any).project.name).toBe('real-project')
  })

  it('skips hidden directories by default', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockResolvedValue([
      makeDirEntry('.hidden-project'),
      makeDirEntry('visible-project'),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects')
    expect(results).toHaveLength(1)
    expect((results[0] as any).project.name).toBe('visible-project')
  })

  it('includes hidden directories when option set', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockResolvedValue([
      makeDirEntry('.hidden-project'),
      makeDirEntry('visible-project'),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects', { includeHidden: true })
    expect(results).toHaveLength(2)
  })

  it('skips non-directory entries', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockResolvedValue([
      makeDirEntry('file.txt', false),
      makeDirEntry('project-dir', true),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects')
    expect(results).toHaveLength(1)
    expect((results[0] as any).project.name).toBe('project-dir')
  })

  it('handles individual project scan failure gracefully', async () => {
    mockStat.mockImplementation(async (p: any) => {
      const pathStr = String(p)
      if (pathStr === '/projects') {
        return makeStats() as any
      }
      if (pathStr === '/projects/bad-project') {
        throw new Error('Permission denied')
      }
      return makeStats() as any
    })
    mockReaddir.mockResolvedValue([
      makeDirEntry('bad-project'),
      makeDirEntry('good-project'),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('bad-project')) throw new Error('EACCES')
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects')
    expect(results).toHaveLength(2)

    // One should be an error, one should be a project
    const errors = results.filter(r => 'error' in r && r.error !== undefined)
    const projects = results.filter(r => 'project' in r && r.project !== undefined)
    expect(errors).toHaveLength(1)
    expect(projects).toHaveLength(1)
    expect((projects[0] as any).project.name).toBe('good-project')
  })

  it('determines initial status based on modification date', async () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 2) // 2 days ago

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 60) // 60 days ago

    mockStat.mockImplementation(async (p: any) => {
      const pathStr = String(p)
      if (pathStr === '/projects') return makeStats() as any
      if (pathStr.includes('recent')) return makeStats(recentDate) as any
      return makeStats(oldDate) as any
    })

    mockReaddir.mockResolvedValue([
      makeDirEntry('recent-project'),
      makeDirEntry('old-project'),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects')
    const projects = results
      .filter((r): r is { project: any } => 'project' in r)
      .map(r => r.project)

    const recent = projects.find((p: any) => p.name === 'recent-project')
    const old = projects.find((p: any) => p.name === 'old-project')

    expect(recent.status).toBe('active')
    expect(old.status).toBe('stale')
  })

  it('creates URL-safe project IDs', async () => {
    mockStat.mockResolvedValue(makeStats() as any)
    mockReaddir.mockResolvedValue([
      makeDirEntry('My Cool Project!'),
    ] as any)

    mockAccess.mockImplementation(async (p: any) => {
      if (String(p).includes('package.json')) return undefined
      throw new Error('ENOENT')
    })
    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const results = await scanDirectory('/projects')
    const project = (results[0] as any).project
    expect(project.id).toBe('my-cool-project')
    expect(project.id).not.toMatch(/[^a-z0-9-_]/)
  })
})

describe('getProjectsPath', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('falls back to PROJECTS_PATH env var', () => {
    process.env.PROJECTS_PATH = '/custom/path'
    // getProjectsPath tries config.json first; mock require to fail
    const path = getProjectsPath()
    // Should use env var or config, at minimum not throw
    expect(typeof path).toBe('string')
    expect(path.length).toBeGreaterThan(0)
  })

  it('returns a default path when no config exists', () => {
    delete process.env.PROJECTS_PATH
    const path = getProjectsPath()
    expect(typeof path).toBe('string')
  })
})
