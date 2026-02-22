"use client"

import * as React from "react"
import { Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { statusLabels, statusIcons } from "@/components/status-badge"
import type { ProjectStatus } from "@/types/project"

interface StatusFilterProps {
  availableStatuses: ProjectStatus[]
  selectedStatuses: ProjectStatus[]
  onStatusesChange: (statuses: ProjectStatus[]) => void
  statusCounts?: Map<ProjectStatus, number>
}

export function StatusFilter({ availableStatuses, selectedStatuses, onStatusesChange, statusCounts }: StatusFilterProps) {
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleStatusToggle = (status: ProjectStatus, checked: boolean) => {
    if (checked) {
      // Add status to selected statuses
      onStatusesChange([...selectedStatuses, status])
    } else {
      // Remove status from selected statuses
      onStatusesChange(selectedStatuses.filter(s => s !== status))
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-9">
        <Activity className="mr-2 h-4 w-4" />
        <span>Status</span>
      </Button>
    )
  }

  const selectedCount = selectedStatuses.length
  const buttonLabel = selectedCount > 0 ? `Status (${selectedCount})` : "Status"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
        >
          <Activity className="mr-2 h-4 w-4" />
          <span>{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableStatuses.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No statuses available
          </div>
        ) : (
          availableStatuses.map((status) => {
            const count = statusCounts?.get(status)
            const label = statusLabels[status]
            const icon = statusIcons[status]

            return (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={(checked) => handleStatusToggle(status, checked)}
              >
                <span className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{icon}</span>
                    <span>{label}</span>
                  </span>
                  {count && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {count}
                    </span>
                  )}
                </span>
              </DropdownMenuCheckboxItem>
            )
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
