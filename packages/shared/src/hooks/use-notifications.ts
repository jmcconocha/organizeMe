"use client"

import * as React from "react"
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  getNotifications,
  dismissNotification as dismissUtil,
  clearAllNotifications as clearUtil,
  detectStatusChanges,
  type NotificationPrefs,
  type AppNotification,
} from "../lib/notifications"

export interface UseNotificationsReturn {
  prefs: NotificationPrefs
  updatePrefs: (prefs: NotificationPrefs) => void
  notifications: AppNotification[]
  unreadCount: number
  dismiss: (notificationId: string) => void
  clearAll: () => void
  checkForChanges: (projects: Array<{ id: string; name: string; status: string }>) => void
}

export function useNotifications(): UseNotificationsReturn {
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(() => getNotificationPrefs())
  const [notifications, setNotifications] = React.useState<AppNotification[]>([])

  React.useEffect(() => {
    setNotifications(getNotifications())
  }, [])

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.dismissed).length,
    [notifications]
  )

  const updatePrefs = React.useCallback((newPrefs: NotificationPrefs) => {
    saveNotificationPrefs(newPrefs)
    setPrefs(newPrefs)
  }, [])

  const dismiss = React.useCallback((notificationId: string) => {
    const updated = dismissUtil(notificationId)
    setNotifications(updated)
  }, [])

  const clearAll = React.useCallback(() => {
    clearUtil()
    setNotifications([])
  }, [])

  const checkForChanges = React.useCallback(
    (projects: Array<{ id: string; name: string; status: string }>) => {
      const { notifications: newNotifs } = detectStatusChanges(projects, prefs)
      if (newNotifs.length > 0) {
        setNotifications(getNotifications())
      }
    },
    [prefs]
  )

  return {
    prefs,
    updatePrefs,
    notifications,
    unreadCount,
    dismiss,
    clearAll,
    checkForChanges,
  }
}
