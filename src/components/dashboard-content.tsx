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
import { SearchBar } from "@/components/search-bar"
import { SortDropdown } from "@/components/sort-dropdown"
import { StatusBadge } from "@/components/status-badge"
import { StatusFilter } from "@/components/status-filter"
import { TagFilter } from "@/components/tag-filter"
import { PaginationControls } from "@/components/pagination-controls"
import { DashboardSettingsDialog } from "@/components/dashboard-settings-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type SortOption, sortProjectsWithFavorites } from "@/lib/sort-utils"
import { useFavorites } from "@/hooks/use-favorites"
import { useStatusFilters } from "@/hooks/use-status-filters"
import { usePagination } from "@/hooks/use-pagination"
import { useArchive } from "@/hooks/use-archive"
import { useDashboardSettings } from "@/hooks/use-dashboard-settings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
 * Archive icon for archive toggle button.
 */
function ArchiveIcon({ className }: { className?: string }) {
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
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25-2.25M12 13.875l-2.25-2.25M12 13.875V21m-8.625-9.75h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
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
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [showArchived, setShowArchived] = React.useState<boolean>(false)
  const { favorites, toggleFavorite } = useFavorites()
  const { archivedProjects, toggleArchive } = useArchive()
  const { settings } = useDashboardSettings()

  // Use the status filters hook for localStorage persistence
  const {
    selectedStatuses: selectedStatusesSet,
    toggleStatusFilter,
    clearStatusFilters: clearStatusFiltersHook
  } = useStatusFilters()

  // Convert Set to Array for component compatibility
  const selectedStatuses = React.useMemo(
    () => Array.from(selectedStatusesSet),
    [selectedStatusesSet]
  )

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

  // Collect all unique statuses from all projects and count their usage
  const { availableStatuses, statusCounts } = React.useMemo(() => {
    const statusesSet = new Set<ProjectStatus>()
    const counts = new Map<ProjectStatus, number>()

    projects.forEach((project) => {
      statusesSet.add(project.status)
      counts.set(project.status, (counts.get(project.status) || 0) + 1)
    })

    // Sort statuses by the defined order
    const sortedStatuses = statusOrder.filter((status) => statusesSet.has(status))

    return {
      availableStatuses: sortedStatuses,
      statusCounts: counts,
    }
  }, [projects])

  // Filter projects by search query
  const searchFilteredProjects = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return projects
    }
    const lowerQuery = searchQuery.toLowerCase()
    return projects.filter((project) => {
      // Search in name, path, and description (case-insensitive)
      return (
        project.name.toLowerCase().includes(lowerQuery) ||
        project.path.toLowerCase().includes(lowerQuery) ||
        (project.description?.toLowerCase().includes(lowerQuery) ?? false)
      )
    })
  }, [projects, searchQuery])

  // Filter projects by selected tags
  const tagFilteredProjects = React.useMemo(() => {
    if (selectedTags.length === 0) {
      return searchFilteredProjects
    }
    return searchFilteredProjects.filter((project) => {
      // Project must have at least one of the selected tags
      return project.tags?.some((tag) => selectedTags.includes(tag))
    })
  }, [searchFilteredProjects, selectedTags])

  // Filter projects by selected statuses
  const statusFilteredProjects = React.useMemo(() => {
    if (selectedStatusesSet.size === 0) {
      return tagFilteredProjects
    }
    return tagFilteredProjects.filter((project) => {
      // Project must have one of the selected statuses
      return selectedStatusesSet.has(project.status)
    })
  }, [tagFilteredProjects, selectedStatusesSet])

  // Filter archived projects - hide by default unless showArchived is true
  const filteredProjects = React.useMemo(() => {
    if (showArchived) {
      return statusFilteredProjects
    }
    return statusFilteredProjects.filter((project) => !archivedProjects.has(project.id))
  }, [statusFilteredProjects, showArchived, archivedProjects])

  // Sort projects based on current sort option with favorites appearing first
  const sortedProjects = React.useMemo(
    () => sortProjectsWithFavorites(filteredProjects, favorites, currentSort),
    [filteredProjects, favorites, currentSort]
  )

  // Pagination hook - paginate the sorted/filtered projects
  const {
    currentPage,
    pageSize,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    startIndex,
    endIndex,
  } = usePagination({
    totalItems: sortedProjects.length,
    initialPageSize: 20,
    syncWithUrl: true,
  })

  // Use a ref for goToPage so the reset effect only fires when filters actually change
  const goToPageRef = React.useRef(goToPage)
  React.useEffect(() => {
    goToPageRef.current = goToPage
  })

  // Reset to page 1 when search query or filters change
  React.useEffect(() => {
    goToPageRef.current(1)
  }, [searchQuery, selectedTags, selectedStatusesSet.size])

  // Get the current page of projects
  const paginatedProjects = React.useMemo(
    () => sortedProjects.slice(startIndex, endIndex),
    [sortedProjects, startIndex, endIndex]
  )

  // Split paginated projects into favorites, non-favorites, and archived for grid view
  const { favoriteProjects, nonFavoriteProjects, archivedProjectsList } = React.useMemo(() => {
    const favSet = new Set(favorites)

    if (showArchived) {
      // When showing archived, split into archived and non-archived
      const archived = paginatedProjects.filter((p) => archivedProjects.has(p.id))
      const nonArchived = paginatedProjects.filter((p) => !archivedProjects.has(p.id))

      return {
        favoriteProjects: nonArchived.filter((p) => favSet.has(p.id)),
        nonFavoriteProjects: nonArchived.filter((p) => !favSet.has(p.id)),
        archivedProjectsList: archived,
      }
    }

    // When not showing archived, archived list is empty
    return {
      favoriteProjects: paginatedProjects.filter((p) => favSet.has(p.id)),
      nonFavoriteProjects: paginatedProjects.filter((p) => !favSet.has(p.id)),
      archivedProjectsList: [],
    }
  }, [paginatedProjects, favorites, showArchived, archivedProjects])

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== "" || selectedTags.length > 0 || selectedStatusesSet.size > 0

  // Handler to clear all filters
  const handleClearFilters = React.useCallback(() => {
    setSearchQuery("")
    setSelectedTags([])
    clearStatusFiltersHook()
  }, [clearStatusFiltersHook])

  // Handler to toggle a status filter when clicking a status card
  const handleStatusCardClick = React.useCallback(
    (status: ProjectStatus) => {
      toggleStatusFilter(status)
    },
    [toggleStatusFilter]
  )

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

            const isActive = selectedStatuses.includes(status)

            return (
              <Card
                key={status}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive
                    ? "ring-2 ring-primary shadow-md"
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => handleStatusCardClick(status)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleStatusCardClick(status)
                  }
                }}
              >
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
        <Tabs defaultValue={settings.defaultView} className="w-full">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 id="projects-heading" className="text-lg font-semibold">
                Projects
              </h2>
              <span className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? `(${sortedProjects.length} of ${projects.length})`
                  : `(${sortedProjects.length})`}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search projects..."
              />

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

              <StatusFilter
                availableStatuses={availableStatuses}
                selectedStatuses={selectedStatuses}
                onStatusesChange={(statuses) => {
                  // Clear all current filters first
                  clearStatusFiltersHook()
                  // Then add each selected status
                  statuses.forEach(status => toggleStatusFilter(status))
                }}
                statusCounts={statusCounts}
              />

              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="gap-1.5"
                title={showArchived ? "Hide archived projects" : "Show archived projects"}
              >
                <ArchiveIcon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {showArchived ? "Hide Archived" : "Show Archived"}
                </span>
                {archivedProjects.size > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {archivedProjects.size}
                  </Badge>
                )}
              </Button>

              <SortDropdown
                currentSort={currentSort}
                onSortChange={setCurrentSort}
              />

              <DashboardSettingsDialog />

              <RefreshButton
                size="sm"
                onRefreshComplete={handleRefreshComplete}
              />
            </div>
          </div>

          {/* Grid View */}
          <TabsContent value="grid" className="mt-0">
            {sortedProjects.length === 0 && hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FolderIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  No projects match your current search or filter criteria.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
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
                          isArchived={archivedProjects.has(project.id)}
                          onArchiveToggle={() => toggleArchive(project.id)}
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
                          isArchived={archivedProjects.has(project.id)}
                          onArchiveToggle={() => toggleArchive(project.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Separator before archived section */}
                {archivedProjectsList.length > 0 && (favoriteProjects.length > 0 || nonFavoriteProjects.length > 0) && (
                  <Separator />
                )}

                {/* Archived Projects Section */}
                {archivedProjectsList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Archived Projects
                      </h3>
                      <Badge variant="secondary">
                        {archivedProjectsList.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
                      {archivedProjectsList.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          viewMode="grid"
                          showDescription
                          showGitInfo
                          isFavorite={favorites.has(project.id)}
                          onToggle={() => toggleFavorite(project.id)}
                          isArchived={archivedProjects.has(project.id)}
                          onArchiveToggle={() => toggleArchive(project.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                </div>

                {/* Pagination Controls */}
                {sortedProjects.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasPreviousPage={hasPreviousPage}
                    hasNextPage={hasNextPage}
                    previousPage={previousPage}
                    nextPage={nextPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table" className="mt-0">
            {sortedProjects.length === 0 && hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FolderIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  No projects match your current search or filter criteria.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <ProjectTable
                    projects={paginatedProjects}
                    onProjectClick={handleProjectClick}
                  />
                </div>

                {/* Pagination Controls */}
                {sortedProjects.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasPreviousPage={hasPreviousPage}
                    hasNextPage={hasNextPage}
                    previousPage={previousPage}
                    nextPage={nextPage}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
