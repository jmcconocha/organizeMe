"use client"

/**
 * Project Detail Actions Component
 *
 * Client component that handles interactive actions for the project detail page:
 * - Open in Finder button
 * - Open in Terminal button
 * - Open in VS Code button
 * - Open in GitHub button (if remote URL available)
 * - Refresh button
 */

import * as React from "react"

import { useDataProvider } from "@organizeme/shared/context/data-provider-context"
import { useNavigation } from "@organizeme/shared/context/navigation-context"
import { trackProjectView } from "@organizeme/shared/lib/recent-projects"
import { Button } from "@organizeme/ui/ui/button"

export interface ProjectDetailActionsProps {
  /** The full filesystem path to the project directory */
  projectPath: string
  /** The project ID for refresh */
  projectId: string
  /** Optional GitHub/remote URL for the project */
  gitRemoteUrl?: string | null
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
 * Terminal icon.
 */
function TerminalIcon({ className }: { className?: string }) {
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
        d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  )
}

/**
 * VS Code icon.
 */
function VSCodeIcon({ className }: { className?: string }) {
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
        d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
      />
    </svg>
  )
}

/**
 * GitHub icon.
 */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
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
  gitRemoteUrl,
}: ProjectDetailActionsProps) {
  const dataProvider = useDataProvider()
  const { refresh } = useNavigation()
  const [isOpening, setIsOpening] = React.useState(false)
  const [isOpeningTerminal, setIsOpeningTerminal] = React.useState(false)
  const [isOpeningVSCode, setIsOpeningVSCode] = React.useState(false)
  const [isOpeningGitHub, setIsOpeningGitHub] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Track this project view on mount
  React.useEffect(() => {
    trackProjectView(projectId)
  }, [projectId])

  const handleOpenInFinder = React.useCallback(async () => {
    setIsOpening(true)
    setError(null)

    try {
      const result = await dataProvider.openInFinder(projectPath)

      if (!result.success) {
        setError(result.message)
      }
    } catch {
      setError("Failed to open in Finder")
    } finally {
      setIsOpening(false)
    }
  }, [projectPath, dataProvider])

  const handleOpenInTerminal = React.useCallback(async () => {
    setIsOpeningTerminal(true)
    setError(null)

    try {
      const result = await dataProvider.openInTerminal(projectPath)

      if (!result.success) {
        setError(result.message)
      }
    } catch {
      setError("Failed to open in Terminal")
    } finally {
      setIsOpeningTerminal(false)
    }
  }, [projectPath, dataProvider])

  const handleOpenInVSCode = React.useCallback(async () => {
    setIsOpeningVSCode(true)
    setError(null)

    try {
      const result = await dataProvider.openInVSCode(projectPath)

      if (!result.success) {
        setError(result.message)
      }
    } catch {
      setError("Failed to open in VS Code")
    } finally {
      setIsOpeningVSCode(false)
    }
  }, [projectPath, dataProvider])

  const handleOpenInGitHub = React.useCallback(async () => {
    if (!gitRemoteUrl) return

    setIsOpeningGitHub(true)
    setError(null)

    try {
      const result = await dataProvider.openInBrowser(gitRemoteUrl)

      if (!result.success) {
        setError(result.message)
      }
    } catch {
      setError("Failed to open in browser")
    } finally {
      setIsOpeningGitHub(false)
    }
  }, [gitRemoteUrl, dataProvider])

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      await dataProvider.refreshProject(projectId)
      refresh()
    } catch {
      setError("Failed to refresh project")
    } finally {
      setIsRefreshing(false)
    }
  }, [projectId, dataProvider, refresh])

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
              Finder
            </>
          )}
        </Button>
        <Button
          onClick={handleOpenInTerminal}
          disabled={isOpeningTerminal}
          variant="default"
          size="default"
        >
          {isOpeningTerminal ? (
            <>
              <LoadingSpinner className="h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <TerminalIcon className="h-4 w-4" />
              Terminal
            </>
          )}
        </Button>
        <Button
          onClick={handleOpenInVSCode}
          disabled={isOpeningVSCode}
          variant="default"
          size="default"
        >
          {isOpeningVSCode ? (
            <>
              <LoadingSpinner className="h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <VSCodeIcon className="h-4 w-4" />
              VS Code
            </>
          )}
        </Button>
        {gitRemoteUrl && (
          <Button
            onClick={handleOpenInGitHub}
            disabled={isOpeningGitHub}
            variant="default"
            size="default"
          >
            {isOpeningGitHub ? (
              <>
                <LoadingSpinner className="h-4 w-4 animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <GitHubIcon className="h-4 w-4" />
                GitHub
              </>
            )}
          </Button>
        )}
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
