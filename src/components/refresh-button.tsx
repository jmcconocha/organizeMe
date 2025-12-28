'use client'

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { refreshProjects, type RefreshResult } from "@/lib/actions"

/**
 * Spinner icon for loading state.
 * Uses CSS animation for smooth rotation.
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Refresh icon for default state.
 */
function RefreshIcon({ className }: { className?: string }) {
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
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  )
}

export interface RefreshButtonProps
  extends Omit<ButtonProps, "onClick" | "disabled"> {
  /** Callback when refresh starts */
  onRefreshStart?: () => void
  /** Callback when refresh completes successfully */
  onRefreshComplete?: (result: RefreshResult) => void
  /** Callback when refresh fails */
  onRefreshError?: (error: Error) => void
  /** Whether to show the icon */
  showIcon?: boolean
  /** Custom label text (defaults to "Refresh") */
  label?: string
  /** Label to show while loading (defaults to "Refreshing...") */
  loadingLabel?: string
}

/**
 * RefreshButton component for triggering project list refresh.
 *
 * Provides visual feedback during refresh with a loading spinner
 * and disabled state. Calls the refreshProjects server action
 * and notifies parent components of the result.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RefreshButton />
 *
 * // With callbacks
 * <RefreshButton
 *   onRefreshComplete={(result) => toast.success(result.message)}
 *   onRefreshError={(error) => toast.error(error.message)}
 * />
 *
 * // Custom styling
 * <RefreshButton
 *   variant="outline"
 *   size="sm"
 *   label="Reload Projects"
 * />
 * ```
 */
function RefreshButton({
  className,
  variant = "outline",
  size = "default",
  showIcon = true,
  label = "Refresh",
  loadingLabel = "Refreshing...",
  onRefreshStart,
  onRefreshComplete,
  onRefreshError,
  ...props
}: RefreshButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleRefresh = React.useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    onRefreshStart?.()

    try {
      const result = await refreshProjects()

      if (result.success) {
        onRefreshComplete?.(result)
      } else {
        onRefreshError?.(new Error(result.message))
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error occurred")
      onRefreshError?.(err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, onRefreshStart, onRefreshComplete, onRefreshError])

  return (
    <Button
      className={cn("gap-2", className)}
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {showIcon && (
        isLoading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <RefreshIcon className="h-4 w-4" />
        )
      )}
      <span>{isLoading ? loadingLabel : label}</span>
    </Button>
  )
}

export { RefreshButton, Spinner, RefreshIcon }
