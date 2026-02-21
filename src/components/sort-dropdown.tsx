"use client"

import * as React from "react"
import { ArrowUpDown } from "lucide-react"

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
import { SortOption, SORT_LABELS } from "@/lib/sort-utils"

interface SortDropdownProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export function SortDropdown({ currentSort, onSortChange }: SortDropdownProps) {
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-9">
        <ArrowUpDown className="mr-2 h-4 w-4" />
        <span>Sort</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
        >
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <span>Sort</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentSort} onValueChange={(value) => onSortChange(value as SortOption)}>
          <DropdownMenuRadioItem value="name-asc">
            {SORT_LABELS["name-asc"]}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-desc">
            {SORT_LABELS["name-desc"]}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="modified-newest">
            {SORT_LABELS["modified-newest"]}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="modified-oldest">
            {SORT_LABELS["modified-oldest"]}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="status">
            {SORT_LABELS.status}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="type">
            {SORT_LABELS.type}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
