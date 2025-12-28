"use client"

import { useEffect } from "react"

import { ErrorDisplay } from "@/components/error-boundary"

/**
 * Error boundary for project detail pages.
 *
 * This component catches errors specific to the project detail view and
 * provides contextual error messaging for project-related failures.
 *
 * Common error scenarios:
 * - Project not found (deleted or renamed)
 * - Git information unavailable
 * - File system permission errors
 * - Network errors when fetching project data
 */
export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log project-specific errors
    if (process.env.NODE_ENV === "development") {
      // Development logging handled by ErrorDisplay component
    }
  }, [error])

  // Determine error type for more specific messaging
  const isNotFound =
    error.message?.toLowerCase().includes("not found") ||
    error.message?.toLowerCase().includes("404")

  const title = isNotFound ? "Project not found" : "Unable to load project"

  const description = isNotFound
    ? "This project may have been moved, renamed, or deleted."
    : "An error occurred while loading project details. Please try again."

  return (
    <ErrorDisplay
      error={error}
      reset={reset}
      title={title}
      description={description}
    />
  )
}
