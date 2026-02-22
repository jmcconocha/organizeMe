"use client"

import * as React from "react"
import { Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useDashboardSettings } from "@/hooks/use-dashboard-settings"
import type { ViewMode, TableColumn, CardDensity } from "@/types/dashboard-settings"
import type { ProjectStatus } from "@/types/project"

interface DashboardSettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DashboardSettingsDialog({ open, onOpenChange }: DashboardSettingsDialogProps) {
  const { settings, updateSettings, resetToDefaults } = useDashboardSettings()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleViewModeChange = (value: string) => {
    updateSettings({ defaultView: value as ViewMode })
  }

  const handleTableColumnToggle = (column: TableColumn, checked: boolean) => {
    const updatedColumns = checked
      ? [...settings.tableColumns, column]
      : settings.tableColumns.filter(c => c !== column)
    updateSettings({ tableColumns: updatedColumns })
  }

  const handleCardDensityChange = (value: string) => {
    updateSettings({ cardDensity: value as CardDensity })
  }

  const handleStatusCardToggle = (status: ProjectStatus, checked: boolean) => {
    const updatedStatuses = checked
      ? [...settings.visibleStatusCards, status]
      : settings.visibleStatusCards.filter(s => s !== status)
    updateSettings({ visibleStatusCards: updatedStatuses })
  }

  if (!mounted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      </Dialog>
    )
  }

  const tableColumns: { id: TableColumn; label: string }[] = [
    { id: 'name', label: 'Name' },
    { id: 'status', label: 'Status' },
    { id: 'branch', label: 'Branch' },
    { id: 'tags', label: 'Tags' },
    { id: 'modified', label: 'Modified' },
  ]

  const statusCards: { id: ProjectStatus; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'stale', label: 'Stale' },
    { id: 'clean', label: 'Clean' },
    { id: 'dirty', label: 'Dirty' },
    { id: 'unknown', label: 'Unknown' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent hover:border-accent transition-all duration-200"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Customize your dashboard layout and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Default View Mode */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Default View Mode</h3>
              <p className="text-sm text-muted-foreground">
                Choose the default view when opening the dashboard
              </p>
            </div>
            <RadioGroup
              value={settings.defaultView}
              onValueChange={handleViewModeChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="view-grid" />
                <Label htmlFor="view-grid" className="cursor-pointer">
                  Grid View
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="table" id="view-table" />
                <Label htmlFor="view-table" className="cursor-pointer">
                  Table View
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Table Columns */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Table Columns</h3>
              <p className="text-sm text-muted-foreground">
                Choose which columns to display in table view
              </p>
            </div>
            <div className="space-y-2">
              {tableColumns.map((column) => {
                const isChecked = settings.tableColumns.includes(column.id)
                return (
                  <div key={column.id} className="flex items-center justify-between">
                    <Label htmlFor={`column-${column.id}`} className="cursor-pointer">
                      {column.label}
                    </Label>
                    <Switch
                      id={`column-${column.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleTableColumnToggle(column.id, checked)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Card Density */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Card Density</h3>
              <p className="text-sm text-muted-foreground">
                Adjust the spacing and size of cards in grid view
              </p>
            </div>
            <RadioGroup
              value={settings.cardDensity}
              onValueChange={handleCardDensityChange}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="density-compact" />
                <Label htmlFor="density-compact" className="cursor-pointer">
                  Compact
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="density-comfortable" />
                <Label htmlFor="density-comfortable" className="cursor-pointer">
                  Comfortable
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spacious" id="density-spacious" />
                <Label htmlFor="density-spacious" className="cursor-pointer">
                  Spacious
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Visible Status Cards */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Visible Status Cards</h3>
              <p className="text-sm text-muted-foreground">
                Choose which status cards to show in the summary section
              </p>
            </div>
            <div className="space-y-2">
              {statusCards.map((status) => {
                const isChecked = settings.visibleStatusCards.includes(status.id)
                return (
                  <div key={status.id} className="flex items-center justify-between">
                    <Label htmlFor={`status-${status.id}`} className="cursor-pointer">
                      {status.label}
                    </Label>
                    <Switch
                      id={`status-${status.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleStatusCardToggle(status.id, checked)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reset to Defaults */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="w-full"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
