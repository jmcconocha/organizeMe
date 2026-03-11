"use client"

import * as React from "react"
import { DashboardContent, type DashboardContentProps } from "@organizeme/ui/components/dashboard-content"
import { useNextPaginationRouter } from "./navigation-provider-wrapper"
import { useDataProvider } from "@organizeme/shared/context/data-provider-context"

/**
 * Web-specific wrapper that provides Next.js pagination router and
 * DataProvider-sourced onRefresh to DashboardContent.
 */
interface DashboardWrapperProps extends Omit<DashboardContentProps, 'paginationRouter' | 'onRefresh'> {
  fromCache?: boolean
  cacheAgeMs?: number | null
  scanErrors?: number
}

export function DashboardWrapper({ fromCache, cacheAgeMs, scanErrors, ...props }: DashboardWrapperProps) {
  const paginationRouter = useNextPaginationRouter()
  const dataProvider = useDataProvider()
  return (
    <DashboardContent
      {...props}
      paginationRouter={paginationRouter}
      onRefresh={dataProvider.refreshProjects}
      fromCache={fromCache}
      cacheAgeMs={cacheAgeMs}
      scanErrors={scanErrors}
    />
  )
}
