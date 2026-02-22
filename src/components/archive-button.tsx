'use client'

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Archive icon for unarchived state (box/inbox).
 */
function ArchiveIcon({ className }: { className?: string }) {
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
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  )
}

/**
 * Unarchive icon for archived state (box with arrow out).
 */
function UnarchiveIcon({ className }: { className?: string }) {
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
        d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"
      />
    </svg>
  )
}

export interface ArchiveButtonProps
  extends Omit<ButtonProps, "onClick" | "onToggle"> {
  /** Whether the item is currently archived */
  isArchived?: boolean
  /** Callback when archive state is toggled */
  onToggle?: (isArchived: boolean) => void
  /** Whether to show the icon */
  showIcon?: boolean
  /** Custom label for archived state (defaults to "Archived") */
  archivedLabel?: string
  /** Custom label for unarchived state (defaults to "Archive") */
  unarchivedLabel?: string
  /** Whether to show the label text */
  showLabel?: boolean
}

/**
 * ArchiveButton component for toggling archive status.
 *
 * Provides visual feedback with archive/unarchive icons
 * and optional label text. Calls onToggle callback when clicked.
 *
 * @example
 * ```tsx
 * // Basic usage (icon only)
 * <ArchiveButton
 *   isArchived={project.isArchived}
 *   onToggle={(isArchived) => updateArchive(project.id, isArchived)}
 * />
 *
 * // With label
 * <ArchiveButton
 *   isArchived={project.isArchived}
 *   onToggle={(isArchived) => updateArchive(project.id, isArchived)}
 *   showLabel
 * />
 *
 * // Custom styling
 * <ArchiveButton
 *   isArchived={project.isArchived}
 *   onToggle={(isArchived) => updateArchive(project.id, isArchived)}
 *   variant="ghost"
 *   size="sm"
 * />
 * ```
 */
function ArchiveButton({
  className,
  variant = "ghost",
  size = "icon",
  isArchived = false,
  showIcon = true,
  showLabel = false,
  archivedLabel = "Archived",
  unarchivedLabel = "Archive",
  onToggle,
  ...props
}: ArchiveButtonProps) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent event propagation to parent elements (e.g., card links)
      e.stopPropagation()
      e.preventDefault()
      onToggle?.(!isArchived)
    },
    [isArchived, onToggle]
  )

  const label = isArchived ? archivedLabel : unarchivedLabel
  const ariaLabel = isArchived ? "Unarchive" : "Archive"

  return (
    <Button
      className={cn(
        "gap-2 transition-colors",
        isArchived && "text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300",
        className
      )}
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isArchived}
      {...props}
    >
      {showIcon && (
        isArchived ? (
          <UnarchiveIcon className="h-4 w-4" />
        ) : (
          <ArchiveIcon className="h-4 w-4" />
        )
      )}
      {showLabel && <span>{label}</span>}
    </Button>
  )
}

export { ArchiveButton, ArchiveIcon, UnarchiveIcon }
