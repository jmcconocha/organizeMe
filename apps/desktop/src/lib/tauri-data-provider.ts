import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import type { DataProvider, RefreshResult, AppResult, TagResult } from "@organizeme/shared/types/data-provider"
import type { AppSettings } from "@organizeme/shared/types/app-settings"
import type { Project, ProjectListResponse } from "@organizeme/shared/types/project"

function errorResult(message: string): AppResult {
  return { success: false, message }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * DataProvider implementation using Tauri IPC commands.
 * Each method calls a Rust command via invoke().
 */
export const tauriDataProvider: DataProvider = {
  refreshProjects: async (): Promise<RefreshResult> => {
    try {
      return await invoke<RefreshResult>("refresh_projects")
    } catch (err) {
      return { success: false, message: errorMessage(err) }
    }
  },

  refreshProject: async (_projectId: string): Promise<void> => {
    // In the Tauri app, refreshing is a no-op since we re-fetch data
    // The web version uses this to revalidate Next.js cache
  },

  openInFinder: async (path: string): Promise<AppResult> => {
    try {
      return await invoke<AppResult>("open_in_finder", { path })
    } catch (err) {
      return errorResult(errorMessage(err))
    }
  },

  openInTerminal: async (path: string): Promise<AppResult> => {
    try {
      return await invoke<AppResult>("open_in_terminal", { path })
    } catch (err) {
      return errorResult(errorMessage(err))
    }
  },

  openInVSCode: async (path: string): Promise<AppResult> => {
    try {
      return await invoke<AppResult>("open_in_vscode", { path })
    } catch (err) {
      return errorResult(errorMessage(err))
    }
  },

  openInBrowser: async (url: string): Promise<AppResult> => {
    try {
      return await invoke<AppResult>("open_in_browser", { url })
    } catch (err) {
      return errorResult(errorMessage(err))
    }
  },

  addProjectTag: async (projectId: string, tag: string): Promise<TagResult> => {
    try {
      return await invoke<TagResult>("add_project_tag", { projectId, tag })
    } catch (err) {
      return { success: false, message: errorMessage(err) }
    }
  },

  removeProjectTag: async (projectId: string, tag: string): Promise<TagResult> => {
    try {
      return await invoke<TagResult>("remove_project_tag", { projectId, tag })
    } catch (err) {
      return { success: false, message: errorMessage(err) }
    }
  },

  getAllTags: async (): Promise<string[]> => {
    try {
      return await invoke<string[]>("get_all_tags")
    } catch {
      return []
    }
  },

  getProjectNotes: async (projectId: string): Promise<string> => {
    try {
      return await invoke<string>("get_project_notes", { projectId })
    } catch {
      return ''
    }
  },

  saveProjectNotes: async (projectId: string, notes: string): Promise<AppResult> => {
    try {
      return await invoke<AppResult>("save_project_notes", { projectId, notes })
    } catch (err) {
      return errorResult(errorMessage(err))
    }
  },

  getAppSettings: async (): Promise<AppSettings> => {
    try {
      return await invoke<AppSettings>("get_app_settings")
    } catch {
      return { projectsPath: '' }
    }
  },

  updateAppSettings: async (updates: Partial<AppSettings>): Promise<AppSettings> => {
    try {
      return await invoke<AppSettings>("update_app_settings", {
        projectsPath: updates.projectsPath,
      })
    } catch {
      return { projectsPath: '' }
    }
  },

  browseForFolder: async (): Promise<string | null> => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Projects Folder",
      })
      return selected as string | null
    } catch {
      return null
    }
  },
}

/**
 * Fetch the full project list from the Rust backend.
 */
export async function getProjects(): Promise<ProjectListResponse> {
  return await invoke<ProjectListResponse>("get_projects")
}

/**
 * Fetch a single project by ID with full detail (README, remote URL, etc.)
 */
export async function getProject(id: string): Promise<Project | null> {
  return await invoke<Project | null>("get_project", { id })
}

/**
 * Fetch README content for a project.
 */
export async function getReadmeContent(projectPath: string): Promise<string | null> {
  return await invoke<string | null>("get_readme_content", { projectPath })
}

/**
 * Get git remote URL for a project.
 */
export async function getGitRemoteUrl(projectPath: string): Promise<string | null> {
  return await invoke<string | null>("get_git_remote_url", { projectPath })
}
