import { describe, it, expect } from 'vitest'
import { getTagColor, getTagColorName } from '../tag-colors'

describe('getTagColor', () => {
  it('returns a string with light and dark mode classes', () => {
    const color = getTagColor('frontend')
    expect(color).toContain('bg-')
    expect(color).toContain('text-')
    expect(color).toContain('dark:bg-')
    expect(color).toContain('dark:text-')
  })

  it('returns the same color for the same tag', () => {
    expect(getTagColor('frontend')).toBe(getTagColor('frontend'))
  })

  it('is case-insensitive', () => {
    expect(getTagColor('Frontend')).toBe(getTagColor('frontend'))
    expect(getTagColor('FRONTEND')).toBe(getTagColor('frontend'))
  })

  it('returns different colors for different tags', () => {
    // Not guaranteed for all pairs but should be true for most
    const colors = new Set(['frontend', 'backend', 'devops', 'design', 'mobile'].map(getTagColor))
    expect(colors.size).toBeGreaterThan(1)
  })
})

describe('getTagColorName', () => {
  it('returns a valid color name', () => {
    const validColors = ['blue', 'green', 'purple', 'pink', 'orange', 'cyan', 'indigo', 'rose', 'teal', 'violet']
    const name = getTagColorName('frontend')
    expect(validColors).toContain(name)
  })

  it('is deterministic', () => {
    expect(getTagColorName('test')).toBe(getTagColorName('test'))
  })

  it('is case-insensitive', () => {
    expect(getTagColorName('Test')).toBe(getTagColorName('test'))
  })
})
