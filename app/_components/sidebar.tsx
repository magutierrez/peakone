'use client'

import { RouteConfigPanel } from '@/components/route-config-panel'
import { SavedRoutesList } from '@/components/saved-routes-list'
import { StravaActivitiesList } from '@/components/strava-activities-list'
import type { GPXData } from '@/lib/types'

interface SidebarProps {
  gpxData: GPXData | null
  gpxFileName: string | null
  error: string | null
  onGPXLoaded: (content: string, fileName: string) => void
  onStravaActivityLoaded: (data: GPXData, fileName: string) => void
  onClearGPX: () => void
  onReverseRoute: () => void
  provider?: string
}

export function Sidebar({
  gpxData,
  gpxFileName,
  error,
  onGPXLoaded,
  onStravaActivityLoaded,
  onClearGPX,
  onReverseRoute,
  provider,
}: SidebarProps) {
  return (
    <aside className="sticky top-[57px] h-[calc(100vh-57px)] w-full shrink-0 overflow-y-auto border-b border-border bg-card p-4 lg:w-80 lg:border-b-0 lg:border-r">
      <div className="flex flex-col gap-8">
        <RouteConfigPanel
          gpxData={gpxData}
          onGPXLoaded={onGPXLoaded}
          gpxFileName={gpxFileName}
          onClearGPX={onClearGPX}
          onReverseRoute={onReverseRoute}
        />

        {provider === 'strava' && <StravaActivitiesList onLoadGPX={onStravaActivityLoaded} />}

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
