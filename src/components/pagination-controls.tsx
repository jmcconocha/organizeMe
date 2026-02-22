"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  previousPage: () => void
  nextPage: () => void
  pageSize: number
  setPageSize: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export function PaginationControls({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  previousPage,
  nextPage,
  pageSize,
  setPageSize,
}: PaginationControlsProps) {
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys if no input/textarea is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }

      if (event.key === "ArrowLeft" && hasPreviousPage) {
        event.preventDefault()
        previousPage()
      } else if (event.key === "ArrowRight" && hasNextPage) {
        event.preventDefault()
        nextPage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasPreviousPage, hasNextPage, previousPage, nextPage])

  if (!mounted) {
    return (
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="h-9">
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-2">Previous</span>
          </Button>
          <Button variant="outline" size="sm" disabled className="h-9">
            <span className="mr-2">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page 1 of 1
          </span>
          <Button variant="outline" size="sm" className="h-9">
            <span>20 per page</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={!hasPreviousPage}
          className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
          title="Previous page (←)"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-2">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNextPage}
          className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
          title="Next page (→)"
        >
          <span className="mr-2">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
            >
              <span>{pageSize} per page</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px]">
            <DropdownMenuLabel>Items per page</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value, 10))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <DropdownMenuRadioItem key={size} value={size.toString()}>
                  {size} per page
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
