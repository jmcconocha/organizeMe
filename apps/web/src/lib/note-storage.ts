/**
 * Note Storage Module
 *
 * Provides persistent storage for project notes using a JSON file.
 * Notes are stored at ~/.organizeme/project-notes.json
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.organizeme')
const NOTES_FILE = join(CONFIG_DIR, 'project-notes.json')

/**
 * Structure for storing project notes.
 * Maps project IDs to their note content string.
 */
export interface ProjectNotesData {
  [projectId: string]: string
}

async function ensureConfigDirectory(): Promise<void> {
  try {
    await mkdir(CONFIG_DIR, { recursive: true })
  } catch {
    // directory already exists
  }
}

/**
 * Loads all project notes from the storage file.
 */
export async function loadProjectNotes(): Promise<ProjectNotesData> {
  try {
    const content = await readFile(NOTES_FILE, 'utf-8')
    return JSON.parse(content) as ProjectNotesData
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }
    console.error('Error loading project notes:', error)
    return {}
  }
}

/**
 * Gets notes for a specific project.
 */
export async function getProjectNotes(projectId: string): Promise<string> {
  const allNotes = await loadProjectNotes()
  return allNotes[projectId] || ''
}

/**
 * Saves notes for a specific project.
 */
export async function saveProjectNotes(
  projectId: string,
  notes: string
): Promise<void> {
  try {
    await ensureConfigDirectory()
    const allNotes = await loadProjectNotes()

    if (notes.trim() === '') {
      delete allNotes[projectId]
    } else {
      allNotes[projectId] = notes
    }

    await writeFile(NOTES_FILE, JSON.stringify(allNotes, null, 2), 'utf-8')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to save notes for project ${projectId}: ${errorMessage}`)
  }
}
