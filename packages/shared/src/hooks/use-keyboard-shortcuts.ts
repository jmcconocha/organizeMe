"use client"

import * as React from "react"

interface KeyboardShortcut {
  /** Key to match (e.g., 'k', '/', 'Escape') */
  key: string
  /** Require Cmd (Mac) or Ctrl (Windows/Linux) */
  metaKey?: boolean
  /** Require Shift */
  shiftKey?: boolean
  /** Handler to run when shortcut is triggered */
  handler: (e: KeyboardEvent) => void
  /** Description for help display */
  description?: string
}

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean
  /** Shortcut definitions */
  shortcuts: KeyboardShortcut[]
}

/**
 * Hook for registering global keyboard shortcuts.
 * Automatically ignores shortcuts when the user is typing in an input/textarea.
 */
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = React.useRef(shortcuts)
  React.useEffect(() => {
    shortcutsRef.current = shortcuts
  })

  React.useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape to blur out of inputs
        if (e.key === "Escape") {
          target.blur()
          return
        }
        return
      }

      for (const shortcut of shortcutsRef.current) {
        const metaMatch = shortcut.metaKey
          ? e.metaKey || e.ctrlKey
          : !e.metaKey && !e.ctrlKey
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && metaMatch && shiftMatch) {
          e.preventDefault()
          shortcut.handler(e)
          return
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [enabled])
}
