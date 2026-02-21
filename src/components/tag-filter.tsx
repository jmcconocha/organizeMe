"use client"

import * as React from "react"
import { Tag } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TagFilterProps {
  availableTags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TagFilter({ availableTags, selectedTags, onTagsChange }: TagFilterProps) {
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleTagToggle = (tag: string, checked: boolean) => {
    if (checked) {
      // Add tag to selected tags
      onTagsChange([...selectedTags, tag])
    } else {
      // Remove tag from selected tags
      onTagsChange(selectedTags.filter(t => t !== tag))
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-9">
        <Tag className="mr-2 h-4 w-4" />
        <span>Tags</span>
      </Button>
    )
  }

  const selectedCount = selectedTags.length
  const buttonLabel = selectedCount > 0 ? `Tags (${selectedCount})` : "Tags"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
        >
          <Tag className="mr-2 h-4 w-4" />
          <span>{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableTags.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No tags available
          </div>
        ) : (
          availableTags.map((tag) => (
            <DropdownMenuCheckboxItem
              key={tag}
              checked={selectedTags.includes(tag)}
              onCheckedChange={(checked) => handleTagToggle(tag, checked)}
            >
              {tag}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
