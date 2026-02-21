/**
 * Tag color utilities for consistent tag styling across the application.
 *
 * Provides a deterministic color mapping based on tag names, ensuring
 * the same tag always displays with the same color across all views.
 */

/**
 * Predefined color palette with visually distinct colors.
 * Each color includes light and dark mode variants for accessibility.
 */
const TAG_COLOR_PALETTE = [
  {
    name: "blue",
    light: "bg-blue-100 text-blue-800 border-blue-200",
    dark: "dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800",
  },
  {
    name: "green",
    light: "bg-green-100 text-green-800 border-green-200",
    dark: "dark:bg-green-900 dark:text-green-100 dark:border-green-800",
  },
  {
    name: "purple",
    light: "bg-purple-100 text-purple-800 border-purple-200",
    dark: "dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
  },
  {
    name: "pink",
    light: "bg-pink-100 text-pink-800 border-pink-200",
    dark: "dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800",
  },
  {
    name: "orange",
    light: "bg-orange-100 text-orange-800 border-orange-200",
    dark: "dark:bg-orange-900 dark:text-orange-100 dark:border-orange-800",
  },
  {
    name: "cyan",
    light: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dark: "dark:bg-cyan-900 dark:text-cyan-100 dark:border-cyan-800",
  },
  {
    name: "indigo",
    light: "bg-indigo-100 text-indigo-800 border-indigo-200",
    dark: "dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-800",
  },
  {
    name: "rose",
    light: "bg-rose-100 text-rose-800 border-rose-200",
    dark: "dark:bg-rose-900 dark:text-rose-100 dark:border-rose-800",
  },
  {
    name: "teal",
    light: "bg-teal-100 text-teal-800 border-teal-200",
    dark: "dark:bg-teal-900 dark:text-teal-100 dark:border-teal-800",
  },
  {
    name: "violet",
    light: "bg-violet-100 text-violet-800 border-violet-200",
    dark: "dark:bg-violet-900 dark:text-violet-100 dark:border-violet-800",
  },
] as const

/**
 * Simple hash function to convert a string to a number.
 * Uses a basic string hashing algorithm for consistent results.
 *
 * @param str - The string to hash
 * @returns A positive integer hash value
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Gets a consistent color class for a given tag name.
 *
 * The same tag name will always return the same color, ensuring
 * visual consistency across the application.
 *
 * @param tagName - The name of the tag
 * @returns Tailwind CSS classes for the tag color (light and dark mode)
 *
 * @example
 * ```tsx
 * const colorClass = getTagColor('frontend')
 * // Returns: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800"
 * ```
 */
export function getTagColor(tagName: string): string {
  const hash = hashString(tagName.toLowerCase())
  const colorIndex = hash % TAG_COLOR_PALETTE.length
  const color = TAG_COLOR_PALETTE[colorIndex]
  return `${color.light} ${color.dark}`
}

/**
 * Gets the color name for a given tag (useful for testing/debugging).
 *
 * @param tagName - The name of the tag
 * @returns The color name from the palette
 *
 * @example
 * ```tsx
 * const colorName = getTagColorName('frontend')
 * // Returns: "blue"
 * ```
 */
export function getTagColorName(tagName: string): string {
  const hash = hashString(tagName.toLowerCase())
  const colorIndex = hash % TAG_COLOR_PALETTE.length
  return TAG_COLOR_PALETTE[colorIndex].name
}
