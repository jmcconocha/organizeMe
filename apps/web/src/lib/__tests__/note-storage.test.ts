import { describe, it, expect, beforeEach, vi } from 'vitest'

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
  loadProjectNotes,
  getProjectNotes,
  saveProjectNotes,
} from '../note-storage'

const mockReadFile = vi.mocked(readFile)
const mockWriteFile = vi.mocked(writeFile)
const mockMkdir = vi.mocked(mkdir)

describe('note-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
  })

  describe('loadProjectNotes', () => {
    it('returns stored notes', async () => {
      const data = { 'project-1': 'Some notes here' }
      mockReadFile.mockResolvedValue(JSON.stringify(data))
      const result = await loadProjectNotes()
      expect(result).toEqual(data)
    })

    it('returns empty object when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException
      error.code = 'ENOENT'
      mockReadFile.mockRejectedValue(error)
      const result = await loadProjectNotes()
      expect(result).toEqual({})
    })

    it('returns empty object for invalid JSON', async () => {
      mockReadFile.mockResolvedValue('not valid json')
      const result = await loadProjectNotes()
      expect(result).toEqual({})
    })
  })

  describe('getProjectNotes', () => {
    it('returns notes for existing project', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': 'my notes' }))
      const notes = await getProjectNotes('p1')
      expect(notes).toBe('my notes')
    })

    it('returns empty string for unknown project', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      const notes = await getProjectNotes('nonexistent')
      expect(notes).toBe('')
    })
  })

  describe('saveProjectNotes', () => {
    it('saves notes to file', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      await saveProjectNotes('p1', 'Hello world')
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('project-notes.json'),
        JSON.stringify({ 'p1': 'Hello world' }, null, 2),
        'utf-8'
      )
    })

    it('removes project entry when notes are empty', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': 'old notes' }))
      await saveProjectNotes('p1', '')
      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenData['p1']).toBeUndefined()
    })

    it('removes project entry when notes are whitespace-only', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': 'old notes' }))
      await saveProjectNotes('p1', '   ')
      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenData['p1']).toBeUndefined()
    })

    it('preserves other projects notes', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ 'p1': 'note1', 'p2': 'note2' }))
      await saveProjectNotes('p1', 'updated')
      const writtenData = JSON.parse(mockWriteFile.mock.calls[0][1] as string)
      expect(writtenData['p1']).toBe('updated')
      expect(writtenData['p2']).toBe('note2')
    })

    it('ensures config directory exists', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}))
      await saveProjectNotes('p1', 'notes')
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('.organizeme'),
        { recursive: true }
      )
    })
  })
})
