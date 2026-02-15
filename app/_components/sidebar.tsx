'use client'

import { RouteConfigPanel } from '@/components/route-config-panel'
import { SavedRoutesList } from '@/components/saved-routes-list'
import type { RouteConfig, GPXData } from '@/lib/types'

interface SidebarProps {
  config: RouteConfig
  setConfig: (config: RouteConfig) => void
  gpxData: GPXData | null
  gpxFileName: string | null
  isLoading: boolean
  error: string | null
  onGPXLoaded: (content: string, fileName: string) => void
  onClearGPX: () => void
  onReverseRoute: () => void
  onAnalyze: () => void
}

export function Sidebar({
  config,
  setConfig,
  gpxData,
  gpxFileName,
  isLoading,
  error,
  onGPXLoaded,
  onClearGPX,
  onReverseRoute,
  onAnalyze,
}: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-border bg-card p-4 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex flex-col gap-8">
        <RouteConfigPanel
          config={config}
          onConfigChange={setConfig}
          gpxData={gpxData}
          onGPXLoaded={onGPXLoaded}
          gpxFileName={gpxFileName}
          onClearGPX={onClearGPX}
          onReverseRoute={onReverseRoute}
          onAnalyze={onAnalyze}
          isLoading={isLoading}
        />

        <SavedRoutesList onLoadRoute={onGPXLoaded} />

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
