/**
 * Dashboard Settings Management Module
 *
 * This module provides utility functions for managing dashboard customization settings
 * using browser localStorage. Settings include view mode, table columns, card density,
 * and visible status cards.
 */

import type { DashboardSettings } from '@/types/dashboard-settings'
import { DEFAULT_DASHBOARD_SETTINGS } from '@/types/dashboard-settings'

/**
 * LocalStorage key for storing dashboard settings.
 */
const DASHBOARD_SETTINGS_STORAGE_KEY = 'organize-me-dashboard-settings'

/**
 * Retrieves the dashboard settings from localStorage.
 *
 * This function safely handles:
 * - Missing localStorage (SSR environments)
 * - Invalid/corrupted localStorage data
 * - Missing or partial settings (falls back to defaults)
 *
 * @returns DashboardSettings object with all customization preferences
 *
 * @example
 * ```ts
 * const settings = getDashboardSettings()
 * console.log(`Default view mode: ${settings.defaultView}`)
 * ```
 */
export function getDashboardSettings(): DashboardSettings {
  // Handle SSR/environments without localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_DASHBOARD_SETTINGS
  }

  try {
    const stored = localStorage.getItem(DASHBOARD_SETTINGS_STORAGE_KEY)
    if (!stored) {
      return DEFAULT_DASHBOARD_SETTINGS
    }

    // Parse stored JSON object
    const parsed = JSON.parse(stored)

    // Validate that parsed data is an object
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_DASHBOARD_SETTINGS
    }

    // Merge parsed settings with defaults to handle missing fields
    // This ensures backward compatibility if new settings are added
    return {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...parsed,
    }
  } catch (error) {
    // Handle JSON parse errors or other issues
    console.error('Failed to load dashboard settings from localStorage:', error)
    return DEFAULT_DASHBOARD_SETTINGS
  }
}

/**
 * Saves the dashboard settings to localStorage.
 *
 * @param settings - Complete DashboardSettings object to persist
 */
function saveDashboardSettings(settings: DashboardSettings): void {
  // Handle SSR/environments without localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    localStorage.setItem(DASHBOARD_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    // Handle storage quota errors or other issues
    console.error('Failed to save dashboard settings to localStorage:', error)
  }
}

/**
 * Updates dashboard settings with partial changes.
 *
 * This function allows updating one or more settings without affecting others.
 * Unspecified settings will retain their current values.
 *
 * @param updates - Partial DashboardSettings object with fields to update
 * @returns The updated complete DashboardSettings object
 *
 * @example
 * ```ts
 * // Update only the default view mode
 * const settings = updateDashboardSettings({ defaultView: 'table' })
 *
 * // Update multiple settings at once
 * const settings = updateDashboardSettings({
 *   cardDensity: 'compact',
 *   defaultView: 'grid'
 * })
 * ```
 */
export function updateDashboardSettings(updates: Partial<DashboardSettings>): DashboardSettings {
  const currentSettings = getDashboardSettings()
  const newSettings = {
    ...currentSettings,
    ...updates,
  }

  saveDashboardSettings(newSettings)
  return newSettings
}

/**
 * Resets all dashboard settings to their default values.
 *
 * This clears all customizations and restores the original settings.
 *
 * @returns The default DashboardSettings object
 *
 * @example
 * ```ts
 * // Reset all settings to defaults
 * const settings = resetDashboardSettings()
 * ```
 */
export function resetDashboardSettings(): DashboardSettings {
  saveDashboardSettings(DEFAULT_DASHBOARD_SETTINGS)
  return DEFAULT_DASHBOARD_SETTINGS
}
