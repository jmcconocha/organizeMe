/**
 * Project Detail Loading Component
 *
 * Next.js App Router loading UI that shows while project details are loading.
 * This file is automatically used by Next.js to wrap page content in Suspense.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

/**
 * Skeleton block component for loading states.
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  )
}

/**
 * Back arrow icon.
 */
function ArrowLeftIcon({ className }: { className?: string }) {
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
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  )
}

/**
 * Loading component for the project detail route.
 *
 * Displays a loading placeholder that matches the project detail page layout.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeftIcon className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6" role="status" aria-label="Loading project details">
          {/* Project Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-72" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>

          <Separator />

          {/* Project Info Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Metadata Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-40 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-12 mb-1" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Git Information Card Skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-44 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <div className="flex items-center gap-2 mt-1">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <div className="flex items-start gap-2 mt-1">
                    <Skeleton className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-1" />
                      <Skeleton className="h-3 w-20 mt-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Screen reader text */}
          <span className="sr-only">Loading project details, please wait...</span>
        </div>
      </div>
    </main>
  )
}
