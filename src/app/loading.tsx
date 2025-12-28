/**
 * Root Loading Component
 *
 * Next.js App Router loading UI that shows while the dashboard is loading.
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
 * Skeleton for a status summary card.
 */
function StatusCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12" />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton for a project card in grid view.
 */
function ProjectCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
      <CardContent className="pb-2 flex-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Loading component for the dashboard route.
 *
 * Displays a loading placeholder that matches the dashboard layout structure.
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6" role="status" aria-label="Loading dashboard">
          {/* Status Summary Cards Skeleton */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatusCardSkeleton key={i} />
              ))}
            </div>
          </section>

          <Separator />

          {/* Projects Section Skeleton */}
          <section>
            {/* Toolbar Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-[140px] rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          </section>

          {/* Screen reader text */}
          <span className="sr-only">Loading projects, please wait...</span>
        </div>
      </div>
    </main>
  )
}
