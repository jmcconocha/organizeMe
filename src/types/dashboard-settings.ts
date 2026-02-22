/**
 * Dashboard Customization - Type Definitions
 *
 * This module defines TypeScript interfaces for dashboard settings,
 * user preferences, and default configuration values.
 */

import type { ProjectStatus } from './project'

/**
 * Default view mode for the dashboard.
 *
 * - 'grid': Display projects as cards in a grid layout
 * - 'table': Display projects in a table with columns
 */
export type ViewMode = 'grid' | 'table'

/**
 * Available table column identifiers.
 * Each represents a data field that can be shown or hidden in table view.
 */
export type TableColumn = 'name' | 'status' | 'branch' | 'tags' | 'modified'

/**
 * Card density options for grid view.
 *
 * - 'compact': Reduced padding and smaller text for information density
 * - 'comfortable': Balanced spacing and readability (default)
 * - 'spacious': Increased padding and larger text for accessibility
 */
export type CardDensity = 'compact' | 'comfortable' | 'spacious'

/**
 * Dashboard settings interface for user customization.
 * All settings are persisted to localStorage across sessions.
 */
export interface DashboardSettings {
  /** Default view mode when loading the dashboard */
  defaultView: ViewMode
  /** Columns visible in table view */
  tableColumns: TableColumn[]
  /** Card spacing and size density in grid view */
  cardDensity: CardDensity
  /** Status card types visible in the summary section */
  visibleStatusCards: ProjectStatus[]
}

/**
 * Default dashboard settings.
 * Used for initial state and when resetting to defaults.
 */
export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  defaultView: 'grid',
  tableColumns: ['name', 'status', 'branch', 'tags', 'modified'],
  cardDensity: 'comfortable',
  visibleStatusCards: ['active', 'stale', 'clean', 'dirty', 'unknown'],
}
