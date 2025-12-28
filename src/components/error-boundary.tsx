"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface ErrorBoundaryProps {
  /** The error that was caught */
  error: Error & { digest?: string }
  /** Function to reset the error boundary and retry */
  reset: () => void
  /** Optional custom title for the error display */
  title?: string
  /** Optional custom description for the error display */
  description?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * ErrorDisplay component for showing error states in a user-friendly way.
 *
 * This component is designed to be used with Next.js App Router's error.tsx
 * convention, but can also be used standalone for any error display needs.
 *
 * Features:
 * - User-friendly error message display
 * - "Try Again" button to reset and retry
 * - Error details expandable for debugging (in development)
 * - Clean, consistent styling with shadcn/ui
 *
 * @example
 * ```tsx
 * // In error.tsx
 * export default function Error({ error, reset }: ErrorBoundaryProps) {
 *   return <ErrorDisplay error={error} reset={reset} />
 * }
 *
 * // With custom messaging
 * <ErrorDisplay
 *   error={error}
 *   reset={reset}
 *   title="Unable to load projects"
 *   description="We couldn't fetch your project list."
 * />
 * ```
 */
export function ErrorDisplay({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  className,
}: ErrorBoundaryProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <div
      className={cn(
        "flex min-h-[400px] items-center justify-center p-6",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ErrorIcon className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show error details toggle in development */}
          {isDevelopment && error.message && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full text-muted-foreground"
                type="button"
              >
                {showDetails ? "Hide" : "Show"} error details
                <ChevronIcon
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform",
                    showDetails && "rotate-180"
                  )}
                />
              </Button>
              {showDetails && (
                <div className="rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-[200px]">
                  <p className="text-destructive font-semibold mb-1">
                    {error.name}: {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-muted-foreground whitespace-pre-wrap break-words">
                      {error.stack}
                    </pre>
                  )}
                  {error.digest && (
                    <p className="mt-2 text-muted-foreground">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full" type="button">
            <RefreshIcon className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/")}
            type="button"
          >
            <HomeIcon className="mr-2 h-4 w-4" />
            Go to dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Error icon (X in circle).
 */
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

/**
 * Refresh icon.
 */
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

/**
 * Home icon.
 */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

/**
 * Chevron icon for expand/collapse.
 */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export { ErrorDisplay as ErrorBoundary }
