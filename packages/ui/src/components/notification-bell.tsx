"use client"

import * as React from "react"
import { useNotifications } from "@organizeme/shared/hooks/use-notifications"
import type { AppNotification, NotificationPrefs } from "@organizeme/shared/lib/notifications"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Separator } from "../ui/separator"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationItemProps {
  notification: AppNotification
  onDismiss: (id: string) => void
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-md ${
        notification.dismissed ? "opacity-50" : "bg-muted/50"
      }`}
    >
      <div
        className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
          notification.type === "dirty" ? "bg-yellow-500" : "bg-orange-500"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{notification.projectName}</p>
        <p className="text-xs text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.timestamp)}
        </p>
      </div>
      {!notification.dismissed && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => onDismiss(notification.id)}
          title="Dismiss"
        >
          <XIcon className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

interface NotificationPrefsFormProps {
  prefs: NotificationPrefs
  onUpdate: (prefs: NotificationPrefs) => void
}

function NotificationPrefsForm({ prefs, onUpdate }: NotificationPrefsFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="notif-enabled" className="text-sm">
          Enable notifications
        </Label>
        <Switch
          id="notif-enabled"
          checked={prefs.enabled}
          onCheckedChange={(enabled) => onUpdate({ ...prefs, enabled })}
        />
      </div>
      {prefs.enabled && (
        <>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-dirty" className="text-sm">
              Notify on dirty projects
            </Label>
            <Switch
              id="notif-dirty"
              checked={prefs.notifyOnDirty}
              onCheckedChange={(notifyOnDirty) => onUpdate({ ...prefs, notifyOnDirty })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-stale" className="text-sm">
              Notify on stale projects
            </Label>
            <Switch
              id="notif-stale"
              checked={prefs.notifyOnStale}
              onCheckedChange={(notifyOnStale) => onUpdate({ ...prefs, notifyOnStale })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-browser" className="text-sm">
              Browser notifications
            </Label>
            <Switch
              id="notif-browser"
              checked={prefs.browserNotifications}
              onCheckedChange={(browserNotifications) =>
                onUpdate({ ...prefs, browserNotifications })
              }
            />
          </div>
        </>
      )}
    </div>
  )
}

export function NotificationBell() {
  const { prefs, updatePrefs, notifications, unreadCount, dismiss, clearAll } =
    useNotifications()
  const [mounted, setMounted] = React.useState(false)
  const [tab, setTab] = React.useState<"notifications" | "settings">("notifications")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const activeNotifications = notifications.filter((n) => !n.dismissed)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 relative" title="Notifications">
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            Status change alerts for your projects.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === "notifications" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("notifications")}
          >
            Alerts{" "}
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={tab === "settings" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("settings")}
          >
            Settings
          </Button>
        </div>

        {tab === "notifications" ? (
          <div className="space-y-2">
            {activeNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications
              </p>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 h-7">
                    <TrashIcon className="h-3 w-3" />
                    Clear all
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {activeNotifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} onDismiss={dismiss} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Separator />
            <NotificationPrefsForm prefs={prefs} onUpdate={updatePrefs} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
