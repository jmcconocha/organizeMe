"use client"

import { useEffect } from "react"

import { ErrorDisplay } from "@/components/error-boundary"

/**
 * Global error boundary for the application.
 *
 * This component handles uncaught errors in the React component tree and displays
 * a user-friendly error message with options to retry or navigate away.
 *
 * In Next.js App Router, this file automatically catches errors from:
 * - Server Components
 * - Client Components
 * - Nested layouts
 *
 * Note: This does NOT catch errors from:
 * - The root layout (requires app/global-error.tsx)
 * - API routes (handled separately)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    // For now, we just log to console in development
    if (process.env.NODE_ENV === "development") {
      // Development logging handled by ErrorDisplay component
    } else {
      // In production, you might want to send to a logging service
      // Example: Sentry.captureException(error)
    }
  }, [error])

  return (
    <ErrorDisplay
      error={error}
      reset={reset}
      title="Something went wrong"
      description="An error occurred while loading this page. Please try again or return to the dashboard."
    />
  )
}
