"use client"

/**
 * usePagination Hook
 *
 * Custom React hook for managing pagination state, navigation, and URL synchronization.
 * Provides stateful pagination controls with automatic URL query parameter updates.
 */

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Pagination configuration options.
 */
export interface UsePaginationOptions {
  /** Total number of items to paginate */
  totalItems: number
  /** Number of items to display per page (default: 20) */
  initialPageSize?: number
  /** Initial page number (default: 1) */
  initialPage?: number
  /** Whether to sync pagination state with URL query parameters (default: true) */
  syncWithUrl?: boolean
}

/**
 * Return type for the usePagination hook.
 */
export interface UsePaginationReturn {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Current page size */
  pageSize: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a previous page */
  hasPreviousPage: boolean
  /** Whether there is a next page */
  hasNextPage: boolean
  /** Navigate to a specific page */
  goToPage: (page: number) => void
  /** Navigate to the next page */
  nextPage: () => void
  /** Navigate to the previous page */
  previousPage: () => void
  /** Change the page size */
  setPageSize: (size: number) => void
  /** Get the start index for slicing an array (0-indexed) */
  startIndex: number
  /** Get the end index for slicing an array (0-indexed, exclusive) */
  endIndex: number
}

/**
 * Custom hook for managing pagination state and navigation.
 *
 * This hook provides:
 * - Stateful pagination controls (current page, page size)
 * - Navigation functions (next, previous, go to page)
 * - Automatic URL query parameter synchronization
 * - Calculated values (total pages, has next/previous)
 * - Array slice indices for easy data pagination
 *
 * @param options - Pagination configuration options
 * @returns Object containing pagination state and navigation functions
 *
 * @example
 * ```tsx
 * function ProjectList({ projects }: { projects: Project[] }) {
 *   const {
 *     currentPage,
 *     pageSize,
 *     totalPages,
 *     startIndex,
 *     endIndex,
 *     nextPage,
 *     previousPage,
 *     setPageSize,
 *   } = usePagination({
 *     totalItems: projects.length,
 *     initialPageSize: 20,
 *   })
 *
 *   // Get the current page of projects
 *   const paginatedProjects = projects.slice(startIndex, endIndex)
 *
 *   return (
 *     <div>
 *       {paginatedProjects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *       <PaginationControls
 *         currentPage={currentPage}
 *         totalPages={totalPages}
 *         onNext={nextPage}
 *         onPrevious={previousPage}
 *         pageSize={pageSize}
 *         onPageSizeChange={setPageSize}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function usePagination({
  totalItems,
  initialPageSize = 20,
  initialPage = 1,
  syncWithUrl = true,
}: UsePaginationOptions): UsePaginationReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state from URL params if syncing is enabled, otherwise use defaults
  const [currentPage, setCurrentPage] = React.useState<number>(() => {
    if (!syncWithUrl) return initialPage
    const pageParam = searchParams.get("page")
    const page = pageParam ? parseInt(pageParam, 10) : initialPage
    return page > 0 ? page : initialPage
  })

  const [pageSize, setPageSizeState] = React.useState<number>(() => {
    if (!syncWithUrl) return initialPageSize
    const pageSizeParam = searchParams.get("pageSize")
    const size = pageSizeParam ? parseInt(pageSizeParam, 10) : initialPageSize
    return size > 0 ? size : initialPageSize
  })

  // Calculate total pages based on total items and page size
  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize))
  }, [totalItems, pageSize])

  // Calculate whether previous/next pages exist
  const hasPreviousPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  // Calculate array slice indices
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  /**
   * Updates the URL with current pagination parameters.
   */
  const updateUrl = React.useCallback(
    (page: number, size: number) => {
      if (!syncWithUrl) return

      const params = new URLSearchParams(searchParams.toString())
      params.set("page", page.toString())
      params.set("pageSize", size.toString())
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, syncWithUrl]
  )

  /**
   * Navigate to a specific page.
   * Clamps the page number to valid range [1, totalPages].
   */
  const goToPage = React.useCallback(
    (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(clampedPage)
      updateUrl(clampedPage, pageSize)
    },
    [totalPages, pageSize, updateUrl]
  )

  /**
   * Navigate to the next page if available.
   */
  const nextPage = React.useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1)
    }
  }, [hasNextPage, currentPage, goToPage])

  /**
   * Navigate to the previous page if available.
   */
  const previousPage = React.useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1)
    }
  }, [hasPreviousPage, currentPage, goToPage])

  /**
   * Change the page size and reset to page 1.
   */
  const setPageSize = React.useCallback(
    (size: number) => {
      const validSize = Math.max(1, size)
      setPageSizeState(validSize)
      // Reset to page 1 when page size changes
      setCurrentPage(1)
      updateUrl(1, validSize)
    },
    [updateUrl]
  )

  // Auto-correct current page if it exceeds total pages
  // This handles the case where filters change and reduce the total items
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      goToPage(totalPages)
    }
  }, [currentPage, totalPages, goToPage])

  return {
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
  }
}
