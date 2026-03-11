'use client'

import { useState, useEffect, useRef, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { MarkdownRenderer } from "./markdown-renderer"

export interface ProjectNotesSectionProps {
  projectId: string
  initialNotes: string
  onSave: (projectId: string, notes: string) => Promise<{ success: boolean }>
}

function NoteIcon({ className }: { className?: string }) {
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
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  )
}

export function ProjectNotesSection({
  projectId,
  initialNotes,
  onSave,
}: ProjectNotesSectionProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [savedNotes, setSavedNotes] = useState(initialNotes)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [mode, setMode] = useState<'edit' | 'preview'>(initialNotes ? 'preview' : 'edit')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const hasChanges = notes !== savedNotes

  // Auto-save with debounce (1.5s after last keystroke)
  useEffect(() => {
    if (!hasChanges) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setSaveStatus('saving')
      startTransition(async () => {
        const result = await onSave(projectId, notes)
        if (result.success) {
          setSavedNotes(notes)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          setSaveStatus('idle')
        }
      })
    }, 1500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [notes, hasChanges, projectId, onSave])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <NoteIcon className="h-5 w-5" />
              Notes
            </CardTitle>
            <CardDescription>Personal notes about this project (supports Markdown)</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              {saveStatus === 'saving' && (
                <span className="text-amber-600 dark:text-amber-400">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-600 dark:text-green-400">Saved</span>
              )}
              {saveStatus === 'idle' && hasChanges && (
                <span className="text-muted-foreground">Unsaved changes</span>
              )}
            </div>
            <div className="flex rounded-md border border-input overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-2 py-1 transition-colors ${mode === 'edit' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode('preview')}
                className={`px-2 py-1 transition-colors ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'edit' ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this project... (Markdown supported)"
            disabled={isPending}
            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
            rows={5}
          />
        ) : (
          <div className="min-h-[120px] rounded-md border border-input bg-background px-3 py-2">
            {notes.trim() ? (
              <MarkdownRenderer content={notes} className="prose-sm" />
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes yet. Switch to Edit to add some.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
