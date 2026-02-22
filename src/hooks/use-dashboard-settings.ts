"use client"

/**
 * useDashboardSettings Hook
 *
 * Custom React hook for managing dashboard customization settings with localStorage persistence.
 * Provides stateful access to dashboard settings and functions to update or reset settings.
 */

import * as React from "react"
import type { DashboardSettings } from "@/types/dashboard-settings"
import { DEFAULT_DASHBOARD_SETTINGS } from "@/types/dashboard-settings"
import {
  getDashboardSettings,
  updateDashboardSettings as updateDashboardSettingsUtil,
  resetDashboardSettings as resetDashboardSettingsUtil,
} from "@/lib/dashboard-settings"

/**
 * Return type for the useDashboardSettings hook.
 */
export interface UseDashboardSettingsReturn {
  /** Current dashboard settings object */
  settings: DashboardSettings
  /** Updates one or more dashboard settings */
  updateSettings: (updates: Partial<DashboardSettings>) => void
  /** Resets all settings to their default values */
  resetToDefaults: () => void
}

/**
 * Custom hook for managing dashboard customization settings.
 *
 * This hook provides:
 * - Stateful access to the dashboard settings object
 * - A function to update partial settings
 * - A function to reset all settings to defaults
 * - Automatic sync with localStorage on mount
 *
 * @returns Object containing settings and helper functions
 *
 * @example
 * ```tsx
 * function DashboardContent() {
 *   const { settings, updateSettings, resetToDefaults } = useDashboardSettings()
 *
 *   return (
 *     <div>
 *       <h1>Current View: {settings.defaultView}</h1>
 *       <button onClick={() => updateSettings({ defaultView: 'table' })}>
 *         Switch to Table View
 *       </button>
 *       <button onClick={resetToDefaults}>
 *         Reset to Defaults
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDashboardSettings(): UseDashboardSettingsReturn {
  // Initialize state with default settings
  const [settings, setSettings] = React.useState<DashboardSettings>(() => DEFAULT_DASHBOARD_SETTINGS)

  // Load settings from localStorage on mount
  React.useEffect(() => {
    setSettings(getDashboardSettings())
  }, [])

  /**
   * Updates one or more dashboard settings.
   * Updates both component state and localStorage.
   */
  const updateSettings = React.useCallback((updates: Partial<DashboardSettings>) => {
    const updatedSettings = updateDashboardSettingsUtil(updates)
    setSettings(updatedSettings)
  }, [])

  /**
   * Resets all dashboard settings to their default values.
   * Updates both component state and localStorage.
   */
  const resetToDefaults = React.useCallback(() => {
    const defaultSettings = resetDashboardSettingsUtil()
    setSettings(defaultSettings)
  }, [])

  return {
    settings,
    updateSettings,
    resetToDefaults,
  }
}
