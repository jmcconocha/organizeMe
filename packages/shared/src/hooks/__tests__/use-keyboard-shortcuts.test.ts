// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts'

describe('useKeyboardShortcuts', () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>
  let removeEventSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addEventSpy = vi.spyOn(document, 'addEventListener')
    removeEventSpy = vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    addEventSpy.mockRestore()
    removeEventSpy.mockRestore()
  })

  it('registers a keydown listener on mount', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'k', metaKey: true, handler: vi.fn() }],
      })
    )
    expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('removes the keydown listener on unmount', () => {
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'k', metaKey: true, handler: vi.fn() }],
      })
    )
    unmount()
    expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('calls handler when matching key is pressed', () => {
    const handler = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: '/', handler }],
      })
    )
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls handler when meta+key matches', () => {
    const handler = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'k', metaKey: true, handler }],
      })
    )
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler when meta is not pressed for meta shortcut', () => {
    const handler = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: 'k', metaKey: true, handler }],
      })
    )
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not register listener when disabled', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: false,
        shortcuts: [{ key: 'k', handler: vi.fn() }],
      })
    )
    // Only the cleanup from prior renders, no new listener
    const keydownCalls = addEventSpy.mock.calls.filter(
      (call) => call[0] === 'keydown'
    )
    expect(keydownCalls).toHaveLength(0)
  })

  it('ignores shortcuts when target is an input element', () => {
    const handler = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: '/', handler }],
      })
    )
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true })
    Object.defineProperty(event, 'target', { value: input })
    document.dispatchEvent(event)
    expect(handler).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })
})
