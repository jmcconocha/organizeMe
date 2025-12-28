import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { ProjectStatus } from "@/types/project"

/**
 * Status badge variants with semantic colors for project status indicators.
 *
 * - active: Green - Project has recent commits and ongoing activity
 * - stale: Yellow/Amber - Project hasn't been modified in a while
 * - clean: Blue - Git working directory is clean with no uncommitted changes
 * - dirty: Red - Git working directory has uncommitted changes
 * - unknown: Gray - Status cannot be determined (e.g., not a Git repo)
 */
const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        active:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        stale:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
        clean:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        dirty:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        unknown:
          "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
      },
    },
    defaultVariants: {
      status: "unknown",
    },
  }
)

/**
 * Human-readable labels for each project status.
 */
const statusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  stale: "Stale",
  clean: "Clean",
  dirty: "Dirty",
  unknown: "Unknown",
}

/**
 * Icon indicators for each status (using Unicode symbols for simplicity).
 */
const statusIcons: Record<ProjectStatus, string> = {
  active: "●",
  stale: "◐",
  clean: "✓",
  dirty: "✗",
  unknown: "?",
}

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** The project status to display */
  status: ProjectStatus
  /** Whether to show the status icon */
  showIcon?: boolean
  /** Whether to show the status label */
  showLabel?: boolean
}

/**
 * StatusBadge component for displaying project status with semantic colors.
 *
 * Provides visual feedback for project health and activity status.
 * Supports icons and labels that can be toggled independently.
 *
 * @example
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="dirty" showIcon />
 * <StatusBadge status="clean" showIcon showLabel />
 * ```
 */
function StatusBadge({
  className,
  status,
  showIcon = true,
  showLabel = true,
  ...props
}: StatusBadgeProps) {
  return (
    <div
      className={cn(statusBadgeVariants({ status }), className)}
      role="status"
      aria-label={`Project status: ${statusLabels[status]}`}
      {...props}
    >
      {showIcon && (
        <span className="mr-1" aria-hidden="true">
          {statusIcons[status]}
        </span>
      )}
      {showLabel && <span>{statusLabels[status]}</span>}
    </div>
  )
}

export { StatusBadge, statusBadgeVariants, statusLabels, statusIcons }
