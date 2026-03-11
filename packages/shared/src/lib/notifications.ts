/**
 * Notifications Management Module
 *
 * Tracks project status changes and manages notification preferences.
 * Uses localStorage for persistence.
 */

const PREFS_KEY = 'organize-me-notification-prefs'
const STATUS_SNAPSHOT_KEY = 'organize-me-status-snapshot'
const NOTIFICATIONS_KEY = 'organize-me-notifications'

export interface NotificationPrefs {
  enabled: boolean
  notifyOnDirty: boolean
  notifyOnStale: boolean
  browserNotifications: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  notifyOnDirty: true,
  notifyOnStale: true,
  browserNotifications: false,
}

export interface StatusSnapshot {
  [projectId: string]: string
}

export interface AppNotification {
  id: string
  projectId: string
  projectName: string
  message: string
  type: 'dirty' | 'stale'
  timestamp: number
  dismissed: boolean
}

// --- Preferences ---

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PREFS
  }
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    if (!stored) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.error('Failed to save notification prefs:', error)
  }
}

// --- Status Snapshot ---

export function getStatusSnapshot(): StatusSnapshot {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const stored = localStorage.getItem(STATUS_SNAPSHOT_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

export function saveStatusSnapshot(snapshot: StatusSnapshot): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    localStorage.setItem(STATUS_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch (error) {
    console.error('Failed to save status snapshot:', error)
  }
}

// --- In-App Notifications ---

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  } catch (error) {
    console.error('Failed to save notifications:', error)
  }
}

export function dismissNotification(notificationId: string): AppNotification[] {
  const notifications = getNotifications().map((n) =>
    n.id === notificationId ? { ...n, dismissed: true } : n
  )
  saveNotifications(notifications)
  return notifications
}

export function clearAllNotifications(): AppNotification[] {
  saveNotifications([])
  return []
}

// --- Status Change Detection ---

export interface StatusChange {
  projectId: string
  projectName: string
  oldStatus: string
  newStatus: string
}

export function detectStatusChanges(
  projects: Array<{ id: string; name: string; status: string }>,
  prefs: NotificationPrefs
): { changes: StatusChange[]; notifications: AppNotification[] } {
  if (!prefs.enabled) return { changes: [], notifications: [] }

  const oldSnapshot = getStatusSnapshot()
  const newSnapshot: StatusSnapshot = {}

  const changes: StatusChange[] = []
  const newNotifications: AppNotification[] = []

  for (const project of projects) {
    newSnapshot[project.id] = project.status
    const oldStatus = oldSnapshot[project.id]

    if (oldStatus && oldStatus !== project.status) {
      const change: StatusChange = {
        projectId: project.id,
        projectName: project.name,
        oldStatus,
        newStatus: project.status,
      }

      if (
        (prefs.notifyOnDirty && project.status === 'dirty') ||
        (prefs.notifyOnStale && project.status === 'stale')
      ) {
        changes.push(change)
        newNotifications.push({
          id: `${project.id}-${Date.now()}`,
          projectId: project.id,
          projectName: project.name,
          message:
            project.status === 'dirty'
              ? `${project.name} has uncommitted changes`
              : `${project.name} has become stale`,
          type: project.status as 'dirty' | 'stale',
          timestamp: Date.now(),
          dismissed: false,
        })
      }
    }
  }

  // Save new snapshot
  saveStatusSnapshot(newSnapshot)

  // Append to existing notifications (keep last 50)
  if (newNotifications.length > 0) {
    const existing = getNotifications().filter((n) => !n.dismissed)
    const all = [...newNotifications, ...existing].slice(0, 50)
    saveNotifications(all)
  }

  return { changes, notifications: newNotifications }
}

// --- Browser Notifications ---

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendBrowserNotification(title: string, body: string): void {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return
  }
  new Notification(title, { body, icon: '/favicon.ico' })
}
