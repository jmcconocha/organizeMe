"use client"

/**
 * Project Detail Actions Component
 *
 * Client component that handles interactive actions for the project detail page:
 * - Open in Finder button
 * - Refresh button
 */

import * as React from "react"
import { useRouter } from "next/navigation"

import { openInFinder, refreshProject } from "@/lib/actions"
import { Button } from "@/components/ui/button"

export interface ProjectDetailActionsProps {
  /** The full filesystem path to the project directory */
  projectPath: string
  /** The project ID for refresh */
  projectId: string
}

/**
 * Folder icon.
 */
function FolderOpenIcon({ className }: { className?: string }) {
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
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  )
}

/**
 * Refresh icon.
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

/**
 * ProjectDetailActions component.
 *
 * Provides action buttons for the project detail page.
 */
export function ProjectDetailActions({
  projectPath,
  projectId,
}: ProjectDetailActionsProps) {
  const router = useRouter()
  const [isOpening, setIsOpening] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleOpenInFinder = React.useCallback(async () => {
    setIsOpening(true)
    setError(null)

    try {
      const result = await openInFinder(projectPath)

      if (!result.success) {
        setError(result.message)
      }
    } catch {
      setError("Failed to open in Finder")
    } finally {
      setIsOpening(false)
    }
  }, [projectPath])

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      await refreshProject(projectId)
      router.refresh()
    } catch {
      setError("Failed to refresh project")
    } finally {
      setIsRefreshing(false)
    }
  }, [projectId, router])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleOpenInFinder}
          disabled={isOpening}
          variant="default"
          size="default"
        >
          {isOpening ? (
            <>
              <LoadingSpinner className="h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <FolderOpenIcon className="h-4 w-4" />
              Open in Finder
            </>
          )}
        </Button>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="default"
        >
          {isRefreshing ? (
            <>
              <LoadingSpinner className="h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshIcon className="h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

/**
 * Loading spinner component.
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
