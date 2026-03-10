/**
 * DataProvider Type Definitions
 *
 * Generic result types and interface for abstracting data operations.
 * Both web (server actions) and desktop (Tauri IPC) implement this interface.
 */

import type { AppSettings } from './app-settings'

/**
 * Generic result type for operations.
 */
export interface AppResult {
  success: boolean
  message: string
}

/**
 * Result type for refresh operations.
 */
export interface RefreshResult extends AppResult {
  projectCount?: number
}

/**
 * Result type for tag operations.
 */
export interface TagResult extends AppResult {
  tags?: string[]
}

/**
 * DataProvider interface for abstracting data operations.
 * Both web (server actions) and desktop (Tauri IPC) implement this.
 */
export interface DataProvider {
  /** Refresh all projects (rescan + revalidate) */
  refreshProjects(): Promise<RefreshResult>
  /** Refresh a single project */
  refreshProject(projectId: string): Promise<void>
  /** Open project directory in system file manager */
  openInFinder(path: string): Promise<AppResult>
  /** Open project directory in terminal */
  openInTerminal(path: string): Promise<AppResult>
  /** Open project directory in VS Code */
  openInVSCode(path: string): Promise<AppResult>
  /** Open URL in default browser */
  openInBrowser(url: string): Promise<AppResult>
  /** Add a tag to a project */
  addProjectTag(projectId: string, tag: string): Promise<TagResult>
  /** Remove a tag from a project */
  removeProjectTag(projectId: string, tag: string): Promise<TagResult>
  /** Get all available tags */
  getAllTags(): Promise<string[]>
  /** Get notes for a project */
  getProjectNotes(projectId: string): Promise<string>
  /** Save notes for a project */
  saveProjectNotes(projectId: string, notes: string): Promise<AppResult>
  /** Get application settings from config file */
  getAppSettings(): Promise<AppSettings>
  /** Update application settings in config file */
  updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings>
  /** Open a native folder picker dialog, returns selected path or null if cancelled */
  browseForFolder(): Promise<string | null>
}
