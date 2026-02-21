"use client"

/**
 * DashboardContent Component
 *
 * Client component that handles the interactive dashboard functionality
 * including view switching, project grid/table display, and status summary.
 */

import * as React from "react"
import { useRouter } from "next/navigation"

import type { Project, ProjectStatus } from "@/types/project"
import { ProjectCard } from "@/components/project-card"
import { ProjectTable } from "@/components/project-table"
import { RefreshButton } from "@/components/refresh-button"
import { SortDropdown } from "@/components/sort-dropdown"
import { StatusBadge } from "@/components/status-badge"
import { TagFilter } from "@/components/tag-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type SortOption, sortProjectsWithFavorites } from "@/lib/sort-utils"
import { useFavorites } from "@/hooks/use-favorites"

/**
 * Status summary type containing counts for each status and total.
 */
export type StatusSummary = Record<ProjectStatus, number> & { total: number }

export interface DashboardContentProps {
  /** List of projects to display */
  projects: Project[]
  /** Pre-computed status summary counts */
  statusSummary: StatusSummary
}

/**
 * Status order for display (most important first).
 */
const statusOrder: ProjectStatus[] = ["dirty", "active", "stale", "clean", "unknown"]

/**
 * Grid icon for view toggle.
 */
function GridIcon({ className }: { className?: string }) {
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
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  )
}

/**
 * List icon for view toggle.
 */
function ListIcon({ className }: { className?: string }) {
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
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  )
}

/**
 * Empty state icon.
 */
function FolderIcon({ className }: { className?: string }) {
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
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  )
}

/**
 * DashboardContent component.
 *
 * Displays the project grid/table with view switching, refresh button,
 * and status summary cards.
 */
export function DashboardContent({
  projects,
  statusSummary,
}: DashboardContentProps) {
  const router = useRouter()
  const [currentSort, setCurrentSort] = React.useState<SortOption>("modified-newest")
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const { favorites, toggleFavorite } = useFavorites()

  const handleRefreshComplete = React.useCallback(() => {
    // Refresh the page to get updated data
    router.refresh()
  }, [router])

  // Handle project click in table view
  const handleProjectClick = React.useCallback(
    (project: Project) => {
      router.push(`/projects/${encodeURIComponent(project.id)}`)
    },
    [router]
  )

  // Collect all unique tags from all projects and count their usage
  const { availableTags, tagCounts } = React.useMemo(() => {
    const tagsSet = new Set<string>()
    const counts = new Map<string, number>()

    projects.forEach((project) => {
      project.tags?.forEach((tag) => {
        tagsSet.add(tag)
        counts.set(tag, (counts.get(tag) || 0) + 1)
      })
    })

    return {
      availableTags: Array.from(tagsSet).sort(),
      tagCounts: counts,
    }
  }, [projects])

  // Filter projects by selected tags
  const filteredProjects = React.useMemo(() => {
    if (selectedTags.length === 0) {
      return projects
    }
    return projects.filter((project) => {
      // Project must have at least one of the selected tags
      return project.tags?.some((tag) => selectedTags.includes(tag))
    })
  }, [projects, selectedTags])

  // Sort projects based on current sort option with favorites appearing first
  const sortedProjects = React.useMemo(
    () => sortProjectsWithFavorites(filteredProjects, favorites, currentSort),
    [filteredProjects, favorites, currentSort]
  )

  // Split projects into favorites and non-favorites for grid view
  const { favoriteProjects, nonFavoriteProjects } = React.useMemo(() => {
    const favSet = new Set(favorites)
    return {
      favoriteProjects: sortedProjects.filter((p) => favSet.has(p.id)),
      nonFavoriteProjects: sortedProjects.filter((p) => !favSet.has(p.id)),
    }
  }, [sortedProjects, favorites])

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FolderIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          No projects were found in your projects directory. Make sure your
          PROJECTS_PATH environment variable points to a directory containing
          project folders.
        </p>
        <RefreshButton
          onRefreshComplete={handleRefreshComplete}
          label="Scan for Projects"
          loadingLabel="Scanning..."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <section aria-labelledby="status-summary-heading">
        <h2 id="status-summary-heading" className="sr-only">
          Project Status Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {/* Total Projects Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{statusSummary.total}</p>
            </CardContent>
          </Card>

          {/* Status Cards */}
          {statusOrder.map((status) => {
            const count = statusSummary[status]
            if (count === 0) return null

            return (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <StatusBadge
                      status={status}
                      showIcon
                      showLabel={false}
                      className="text-[10px] px-1.5 py-0"
                    />
                    <span className="capitalize">{status}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* Projects View */}
      <section aria-labelledby="projects-heading">
        <Tabs defaultValue="grid" className="w-full">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 id="projects-heading" className="text-lg font-semibold">
                Projects
              </h2>
              <span className="text-sm text-muted-foreground">
                ({sortedProjects.length})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <TabsList>
                <TabsTrigger value="grid" className="gap-1.5">
                  <GridIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1.5">
                  <ListIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </TabsTrigger>
              </TabsList>

              <TagFilter
                availableTags={availableTags}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                tagCounts={tagCounts}
              />

              <SortDropdown
                currentSort={currentSort}
                onSortChange={setCurrentSort}
              />

              <RefreshButton
                size="sm"
                onRefreshComplete={handleRefreshComplete}
              />
            </div>
          </div>

          {/* Grid View */}
          <TabsContent value="grid" className="mt-0">
            <div className="space-y-6">
              {/* Favorites Section */}
              {favoriteProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Favorites
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({favoriteProjects.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {favoriteProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewMode="grid"
                        showDescription
                        showGitInfo
                        isFavorite={true}
                        onToggle={() => toggleFavorite(project.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Separator between favorites and other projects */}
              {favoriteProjects.length > 0 && nonFavoriteProjects.length > 0 && (
                <Separator />
              )}

              {/* Other Projects Section */}
              {nonFavoriteProjects.length > 0 && (
                <div>
                  {favoriteProjects.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Other Projects
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        ({nonFavoriteProjects.length})
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {nonFavoriteProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        viewMode="grid"
                        showDescription
                        showGitInfo
                        isFavorite={false}
                        onToggle={() => toggleFavorite(project.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table" className="mt-0">
            <div className="border rounded-lg overflow-hidden">
              <ProjectTable
                projects={sortedProjects}
                onProjectClick={handleProjectClick}
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
