"use client"

import { ProjectNotesSection } from "@organizeme/ui/components/project-notes-section"
import { useDataProvider } from "@organizeme/shared/context/data-provider-context"

export function ProjectNotesWrapper({ projectId, initialNotes }: {
  projectId: string
  initialNotes: string
}) {
  const dataProvider = useDataProvider()
  return (
    <ProjectNotesSection
      projectId={projectId}
      initialNotes={initialNotes}
      onSave={async (pid, notes) => {
        const result = await dataProvider.saveProjectNotes(pid, notes)
        return { success: result.success }
      }}
    />
  )
}
