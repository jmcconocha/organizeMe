import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fs/promises before importing the module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('os', () => ({
  homedir: vi.fn(() => '/mock-home'),
}))

import { readFile, writeFile, mkdir } from 'fs/promises'
import {
  loadProjectTags,
  saveProjectTags,
  getProjectTags,
  getAllTags,
  getTagUsageCounts,
  addTagToProject,
  removeTagFromProject,
} from '../tag-storage'

const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)
const mockMkdir = vi.mocked(mkdir)

describe('tag-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
  })

  describe('loadProjectTags', () => {
    it('returns stored tags', async () => {
      const data = { 'project-1': ['tag-a', 'tag-b'] }
      mockReadFile.mockResolvedValue(JSON.stringify(data))
      const result = await loadProjectTags()
      expect(result).toEqual(data)
    })

    it('returns empty object when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockReadFile.mockRejectedValue(error)
      const result = await loadProjectTags()
      expect(result).toEqual({})
    })

    it('returns empty object for invalid JSON', async () => {
      mockReadFile.mockResolvedValue('not valid json')
      const result = await loadProjectTags()
      expect(result).toEqual({})
    })
  })

  describe('saveProjectTags', () => {
    it('saves tags to file', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      await saveProjectTags('project-1', ['tag-a'])
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('project-tags.json'),
        JSON.stringify({ 'project-1': ['tag-a'] }, null, 2),
        'utf-8'
      )
    })

    it('removes project entry when tags are empty', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'project-1': ['tag-a'] }))
      await saveProjectTags('project-1', [])
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('project-tags.json'),
        JSON.stringify({}, null, 2),
        'utf-8'
      )
    })

    it('ensures config directory exists', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      await saveProjectTags('p1', ['t1'])
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('.organizeme'),
        { recursive: true }
      )
    })
  })

  describe('getProjectTags', () => {
    it('returns tags for existing project', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'project-1': ['a', 'b'] }))
      const tags = await getProjectTags('project-1')
      expect(tags).toEqual(['a', 'b'])
    })

    it('returns empty array for unknown project', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      const tags = await getProjectTags('nonexistent')
      expect(tags).toEqual([])
    })
  })

  describe('getAllTags', () => {
    it('returns sorted unique tags across all projects', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        'p1': ['frontend', 'react'],
        'p2': ['backend', 'react'],
        'p3': ['frontend'],
      }))
      const tags = await getAllTags()
      expect(tags).toEqual(['backend', 'frontend', 'react'])
    })

    it('returns empty array when no tags', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      expect(await getAllTags()).toEqual([])
    })
  })

  describe('getTagUsageCounts', () => {
    it('counts tag usage across projects', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({
        'p1': ['frontend', 'react'],
        'p2': ['backend', 'react'],
        'p3': ['frontend'],
      }))
      const counts = await getTagUsageCounts()
      expect(counts.get('frontend')).toBe(2)
      expect(counts.get('react')).toBe(2)
      expect(counts.get('backend')).toBe(1)
    })
  })

  describe('addTagToProject', () => {
    it('adds a new tag', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': ['existing'] }))
      await addTagToProject('p1', 'new-tag')
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('new-tag'),
        'utf-8'
      )
    })

    it('does not duplicate existing tag', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': ['existing'] }))
      await addTagToProject('p1', 'existing')
      // writeFile should not be called because the tag already exists
      expect(mockWriteFile).not.toHaveBeenCalled()
    })
  })

  describe('removeTagFromProject', () => {
    it('removes a tag', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': ['keep', 'remove'] }))
      await removeTagFromProject('p1', 'remove')
      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenData['p1']).toEqual(['keep'])
    })

    it('handles removing non-existent tag', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': ['keep'] }))
      await removeTagFromProject('p1', 'nonexistent')
      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenData['p1']).toEqual(['keep'])
    })
  })
})
