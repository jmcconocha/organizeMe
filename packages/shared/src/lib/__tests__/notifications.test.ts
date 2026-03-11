import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  getStatusSnapshot,
  saveStatusSnapshot,
  getNotifications,
  saveNotifications,
  dismissNotification,
  clearAllNotifications,
  detectStatusChanges,
  DEFAULT_PREFS,
  type NotificationPrefs,
  type AppNotification,
} from '../notifications'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
})
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('notifications', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('getNotificationPrefs', () => {
    it('returns defaults when nothing stored', () => {
      expect(getNotificationPrefs()).toEqual(DEFAULT_PREFS)
    })

    it('returns stored prefs merged with defaults', () => {
      localStorageMock.setItem(
        'organize-me-notification-prefs',
        JSON.stringify({ enabled: false })
      )
      const prefs = getNotificationPrefs()
      expect(prefs.enabled).toBe(false)
      expect(prefs.notifyOnDirty).toBe(true)
    })

    it('returns defaults for invalid JSON', () => {
      localStorageMock.setItem('organize-me-notification-prefs', 'bad')
      expect(getNotificationPrefs()).toEqual(DEFAULT_PREFS)
    })
  })

  describe('saveNotificationPrefs', () => {
    it('persists prefs to localStorage', () => {
      const prefs: NotificationPrefs = { ...DEFAULT_PREFS, enabled: false }
      saveNotificationPrefs(prefs)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'organize-me-notification-prefs',
        JSON.stringify(prefs)
      )
    })
  })

  describe('getStatusSnapshot', () => {
    it('returns empty object when nothing stored', () => {
      expect(getStatusSnapshot()).toEqual({})
    })

    it('returns stored snapshot', () => {
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'active' })
      )
      expect(getStatusSnapshot()).toEqual({ p1: 'active' })
    })

    it('returns empty object for invalid JSON', () => {
      localStorageMock.setItem('organize-me-status-snapshot', 'bad')
      expect(getStatusSnapshot()).toEqual({})
    })
  })

  describe('saveStatusSnapshot', () => {
    it('persists snapshot to localStorage', () => {
      saveStatusSnapshot({ p1: 'dirty' })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'dirty' })
      )
    })
  })

  describe('getNotifications', () => {
    it('returns empty array when nothing stored', () => {
      expect(getNotifications()).toEqual([])
    })

    it('returns stored notifications', () => {
      const notifs: AppNotification[] = [
        {
          id: 'n1',
          projectId: 'p1',
          projectName: 'Project 1',
          message: 'test',
          type: 'dirty',
          timestamp: 1000,
          dismissed: false,
        },
      ]
      localStorageMock.setItem('organize-me-notifications', JSON.stringify(notifs))
      expect(getNotifications()).toEqual(notifs)
    })

    it('returns empty array for invalid JSON', () => {
      localStorageMock.setItem('organize-me-notifications', 'bad')
      expect(getNotifications()).toEqual([])
    })
  })

  describe('dismissNotification', () => {
    it('marks a notification as dismissed', () => {
      const notifs: AppNotification[] = [
        {
          id: 'n1',
          projectId: 'p1',
          projectName: 'Project 1',
          message: 'test',
          type: 'dirty',
          timestamp: 1000,
          dismissed: false,
        },
        {
          id: 'n2',
          projectId: 'p2',
          projectName: 'Project 2',
          message: 'test2',
          type: 'stale',
          timestamp: 1001,
          dismissed: false,
        },
      ]
      localStorageMock.setItem('organize-me-notifications', JSON.stringify(notifs))
      const result = dismissNotification('n1')
      expect(result[0].dismissed).toBe(true)
      expect(result[1].dismissed).toBe(false)
    })

    it('does not affect other notifications', () => {
      const notifs: AppNotification[] = [
        {
          id: 'n1',
          projectId: 'p1',
          projectName: 'P1',
          message: 'test',
          type: 'dirty',
          timestamp: 1000,
          dismissed: false,
        },
      ]
      localStorageMock.setItem('organize-me-notifications', JSON.stringify(notifs))
      const result = dismissNotification('nonexistent')
      expect(result[0].dismissed).toBe(false)
    })
  })

  describe('clearAllNotifications', () => {
    it('clears all notifications', () => {
      const notifs: AppNotification[] = [
        {
          id: 'n1',
          projectId: 'p1',
          projectName: 'P1',
          message: 'test',
          type: 'dirty',
          timestamp: 1000,
          dismissed: false,
        },
      ]
      localStorageMock.setItem('organize-me-notifications', JSON.stringify(notifs))
      const result = clearAllNotifications()
      expect(result).toEqual([])
    })
  })

  describe('detectStatusChanges', () => {
    it('returns empty when prefs disabled', () => {
      const prefs: NotificationPrefs = { ...DEFAULT_PREFS, enabled: false }
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'P1', status: 'dirty' }],
        prefs
      )
      expect(result.changes).toEqual([])
      expect(result.notifications).toEqual([])
    })

    it('detects dirty status change', () => {
      // Set up previous snapshot
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'clean' })
      )
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'Project 1', status: 'dirty' }],
        DEFAULT_PREFS
      )
      expect(result.changes).toHaveLength(1)
      expect(result.changes[0].oldStatus).toBe('clean')
      expect(result.changes[0].newStatus).toBe('dirty')
      expect(result.notifications).toHaveLength(1)
      expect(result.notifications[0].type).toBe('dirty')
    })

    it('detects stale status change', () => {
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'active' })
      )
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'Project 1', status: 'stale' }],
        DEFAULT_PREFS
      )
      expect(result.changes).toHaveLength(1)
      expect(result.notifications[0].type).toBe('stale')
      expect(result.notifications[0].message).toContain('stale')
    })

    it('ignores changes when notifyOnDirty is false', () => {
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'clean' })
      )
      const prefs: NotificationPrefs = { ...DEFAULT_PREFS, notifyOnDirty: false }
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'P1', status: 'dirty' }],
        prefs
      )
      expect(result.changes).toHaveLength(0)
    })

    it('ignores changes when notifyOnStale is false', () => {
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'active' })
      )
      const prefs: NotificationPrefs = { ...DEFAULT_PREFS, notifyOnStale: false }
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'P1', status: 'stale' }],
        prefs
      )
      expect(result.changes).toHaveLength(0)
    })

    it('does not notify for new projects (no old snapshot)', () => {
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'P1', status: 'dirty' }],
        DEFAULT_PREFS
      )
      expect(result.changes).toHaveLength(0)
      expect(result.notifications).toHaveLength(0)
    })

    it('does not notify when status unchanged', () => {
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'dirty' })
      )
      const result = detectStatusChanges(
        [{ id: 'p1', name: 'P1', status: 'dirty' }],
        DEFAULT_PREFS
      )
      expect(result.changes).toHaveLength(0)
    })

    it('saves new snapshot after detection', () => {
      detectStatusChanges(
        [{ id: 'p1', name: 'P1', status: 'active' }],
        DEFAULT_PREFS
      )
      const snapshot = JSON.parse(
        localStorageMock.getItem('organize-me-status-snapshot')!
      )
      expect(snapshot).toEqual({ p1: 'active' })
    })

    it('limits stored notifications to 50', () => {
      // Pre-fill with 49 existing notifications
      const existing: AppNotification[] = Array.from({ length: 49 }, (_, i) => ({
        id: `old-${i}`,
        projectId: `p-old-${i}`,
        projectName: `Old ${i}`,
        message: 'old',
        type: 'dirty' as const,
        timestamp: 1000 + i,
        dismissed: false,
      }))
      localStorageMock.setItem('organize-me-notifications', JSON.stringify(existing))
      localStorageMock.setItem(
        'organize-me-status-snapshot',
        JSON.stringify({ p1: 'clean', p2: 'clean' })
      )

      detectStatusChanges(
        [
          { id: 'p1', name: 'P1', status: 'dirty' },
          { id: 'p2', name: 'P2', status: 'dirty' },
        ],
        DEFAULT_PREFS
      )

      const stored = JSON.parse(
        localStorageMock.getItem('organize-me-notifications')!
      )
      expect(stored.length).toBeLessThanOrEqual(50)
    })
  })
})
