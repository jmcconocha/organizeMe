"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search projects...",
  debounceMs = 300
}: SearchBarProps) {
  const [mounted, setMounted] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync local value with prop value
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer for debounced update
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }

  const handleClear = () => {
    setLocalValue("")
    onChange("")

    // Clear any pending debounced updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }

  if (!mounted) {
    return (
      <div className="relative flex-1 max-w-md">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          className="h-9 pl-9 pr-9 border-border/50 bg-background/50 backdrop-blur-sm"
          placeholder={placeholder}
          disabled
        />
      </div>
    )
  }

  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-4 w-4" />
      </div>
      <Input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="h-9 pl-9 pr-9 border-border/50 bg-background/50 backdrop-blur-sm hover:border-accent focus:border-accent transition-all duration-200"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent"
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
