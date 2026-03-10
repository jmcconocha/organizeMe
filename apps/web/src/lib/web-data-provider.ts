/**
 * Web DataProvider Implementation
 *
 * Wraps Next.js server actions into the DataProvider interface.
 * This is NOT a 'use server' file - it imports and re-exports
 * server actions in the DataProvider shape for use via context.
 */

import type { DataProvider } from "@organizeme/shared/types/data-provider"
import type { AppSettings } from "@organizeme/shared/types/app-settings"
import {
  refreshProjects as refreshProjectsAction,
  refreshProject as refreshProjectAction,
  openInFinder as openInFinderAction,
  openInTerminal as openInTerminalAction,
  openInVSCode as openInVSCodeAction,
  openInBrowser as openInBrowserAction,
  addProjectTag as addProjectTagAction,
  removeProjectTag as removeProjectTagAction,
  getAllTags as getAllTagsAction,
  getProjectNotes as getProjectNotesAction,
  saveProjectNotes as saveProjectNotesAction,
  getAppSettings as getAppSettingsAction,
  updateAppSettings as updateAppSettingsAction,
  browseForFolder as browseForFolderAction,
} from "./actions"

export const webDataProvider: DataProvider = {
  refreshProjects: async () => {
    const result = await refreshProjectsAction()
    return {
      success: result.success,
      message: result.message,
      projectCount: result.projectCount,
    }
  },
  refreshProject: refreshProjectAction,
  openInFinder: openInFinderAction,
  openInTerminal: openInTerminalAction,
  openInVSCode: openInVSCodeAction,
  openInBrowser: openInBrowserAction,
  addProjectTag: async (projectId, tag) => {
    const result = await addProjectTagAction(projectId, tag)
    return {
      success: result.success,
      message: result.message,
      tags: result.tags,
    }
  },
  removeProjectTag: async (projectId, tag) => {
    const result = await removeProjectTagAction(projectId, tag)
    return {
      success: result.success,
      message: result.message,
      tags: result.tags,
    }
  },
  getAllTags: getAllTagsAction,
  getProjectNotes: getProjectNotesAction,
  saveProjectNotes: saveProjectNotesAction,
  getAppSettings: getAppSettingsAction,
  updateAppSettings: async (updates: Partial<AppSettings>): Promise<AppSettings> => {
    return await updateAppSettingsAction(updates)
  },
  browseForFolder: browseForFolderAction,
}
