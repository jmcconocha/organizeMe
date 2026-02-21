import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getTagColor } from "@/lib/tag-colors"

export interface TagInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Current selected tags */
  value?: string[]
  /** Callback when tags change */
  onChange?: (tags: string[]) => void
  /** Available tags for autocomplete suggestions */
  availableTags?: string[]
  /** Placeholder text for the input */
  placeholder?: string
  /** Maximum number of tags allowed */
  maxTags?: number
  /** Whether the input is disabled */
  disabled?: boolean
}

/**
 * TagInput component with autocomplete functionality.
 *
 * Features:
 * - Tag display with remove buttons
 * - Input field for adding new tags
 * - Autocomplete suggestions from existing tags
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click to select from suggestions
 * - Prevents duplicate tags
 * - Optional tag limit
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TagInput
 *   value={tags}
 *   onChange={setTags}
 *   availableTags={['frontend', 'backend', 'mobile']}
 * />
 *
 * // With max tags limit
 * <TagInput
 *   value={tags}
 *   onChange={setTags}
 *   availableTags={existingTags}
 *   maxTags={5}
 *   placeholder="Add tags..."
 * />
 * ```
 */
const TagInput = React.forwardRef<HTMLDivElement, TagInputProps>(
  (
    {
      className,
      value = [],
      onChange,
      availableTags = [],
      placeholder = "Add tags...",
      maxTags,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState("")
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const suggestionsRef = React.useRef<HTMLDivElement>(null)

    // Filter suggestions based on input value and exclude already selected tags
    const filteredSuggestions = React.useMemo(() => {
      if (!inputValue.trim()) return []

      const lowerInput = inputValue.toLowerCase()
      return availableTags
        .filter(tag =>
          tag.toLowerCase().includes(lowerInput) &&
          !value.includes(tag)
        )
        .slice(0, 5) // Limit to 5 suggestions
    }, [inputValue, availableTags, value])

    // Show/hide suggestions based on input and filtered results
    React.useEffect(() => {
      setShowSuggestions(inputValue.trim().length > 0 && filteredSuggestions.length > 0)
      setSelectedIndex(-1)
    }, [inputValue, filteredSuggestions.length])

    /**
     * Add a tag to the selected tags list
     */
    const addTag = React.useCallback((tag: string) => {
      const trimmedTag = tag.trim()

      if (!trimmedTag) return
      if (value.includes(trimmedTag)) return
      if (maxTags && value.length >= maxTags) return

      onChange?.([ ...value, trimmedTag])
      setInputValue("")
      setShowSuggestions(false)
      setSelectedIndex(-1)
      inputRef.current?.focus()
    }, [value, onChange, maxTags])

    /**
     * Remove a tag from the selected tags list
     */
    const removeTag = React.useCallback((tagToRemove: string) => {
      onChange?.(value.filter(tag => tag !== tagToRemove))
      inputRef.current?.focus()
    }, [value, onChange])

    /**
     * Handle input change
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }

    /**
     * Handle input keydown for keyboard navigation and tag addition
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()

        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          // Add selected suggestion
          addTag(filteredSuggestions[selectedIndex])
        } else if (inputValue.trim()) {
          // Add new tag from input
          addTag(inputValue)
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        // Remove last tag if input is empty
        removeTag(value[value.length - 1])
      }
    }

    /**
     * Handle clicking outside to close suggestions
     */
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const isMaxTagsReached = maxTags ? value.length >= maxTags : false

    return (
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        {...props}
      >
        {/* Tags container and input */}
        <div
          className={cn(
            "flex flex-wrap gap-2 min-h-[42px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {/* Selected tags */}
          {value.map((tag) => (
            <Badge
              key={tag}
              className={cn(
                "gap-1 pr-1.5 pl-2.5 border",
                getTagColor(tag)
              )}
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.trim() && filteredSuggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            disabled={disabled || isMaxTagsReached}
            placeholder={value.length === 0 ? placeholder : ""}
            className={cn(
              "flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground",
              "disabled:cursor-not-allowed"
            )}
          />
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 rounded-md border border-input bg-popover shadow-md"
          >
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-sm cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:bg-accent focus:text-accent-foreground",
                    selectedIndex === index && "bg-accent text-accent-foreground"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Max tags indicator */}
        {maxTags && (
          <div className="mt-1 text-xs text-muted-foreground">
            {value.length}/{maxTags} tags
          </div>
        )}
      </div>
    )
  }
)
TagInput.displayName = "TagInput"

export { TagInput }
