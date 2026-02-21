'use client'

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Star icon for unfavorited state (outline).
 */
function StarIcon({ className }: { className?: string }) {
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
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  )
}

/**
 * Star icon for favorited state (filled).
 */
function StarFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export interface FavoriteButtonProps
  extends Omit<ButtonProps, "onClick" | "onToggle"> {
  /** Whether the item is currently favorited */
  isFavorite?: boolean
  /** Callback when favorite state is toggled */
  onToggle?: (isFavorite: boolean) => void
  /** Whether to show the icon */
  showIcon?: boolean
  /** Custom label for favorited state (defaults to "Favorited") */
  favoritedLabel?: string
  /** Custom label for unfavorited state (defaults to "Favorite") */
  unfavoritedLabel?: string
  /** Whether to show the label text */
  showLabel?: boolean
}

/**
 * FavoriteButton component for toggling favorite/pin status.
 *
 * Provides visual feedback with filled/outline star icons
 * and optional label text. Calls onToggle callback when clicked.
 *
 * @example
 * ```tsx
 * // Basic usage (icon only)
 * <FavoriteButton
 *   isFavorite={project.isFavorite}
 *   onToggle={(isFavorite) => updateFavorite(project.id, isFavorite)}
 * />
 *
 * // With label
 * <FavoriteButton
 *   isFavorite={project.isFavorite}
 *   onToggle={(isFavorite) => updateFavorite(project.id, isFavorite)}
 *   showLabel
 * />
 *
 * // Custom styling
 * <FavoriteButton
 *   isFavorite={project.isFavorite}
 *   onToggle={(isFavorite) => updateFavorite(project.id, isFavorite)}
 *   variant="ghost"
 *   size="sm"
 * />
 * ```
 */
function FavoriteButton({
  className,
  variant = "ghost",
  size = "icon",
  isFavorite = false,
  showIcon = true,
  showLabel = false,
  favoritedLabel = "Favorited",
  unfavoritedLabel = "Favorite",
  onToggle,
  ...props
}: FavoriteButtonProps) {
  const handleClick = React.useCallback(() => {
    onToggle?.(!isFavorite)
  }, [isFavorite, onToggle])

  const label = isFavorite ? favoritedLabel : unfavoritedLabel
  const ariaLabel = isFavorite ? "Remove from favorites" : "Add to favorites"

  return (
    <Button
      className={cn(
        "gap-2 transition-colors",
        isFavorite && "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-500",
        className
      )}
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
      {...props}
    >
      {showIcon && (
        isFavorite ? (
          <StarFilledIcon className="h-4 w-4" />
        ) : (
          <StarIcon className="h-4 w-4" />
        )
      )}
      {showLabel && <span>{label}</span>}
    </Button>
  )
}

export { FavoriteButton, StarIcon, StarFilledIcon }
