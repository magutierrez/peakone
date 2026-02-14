import { RouteConfigPanel } from '@/components/route-config-panel'
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
  onAnalyze,
}: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-border bg-card p-4 lg:w-80 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:h-[calc(100vh-57px)]">
      <RouteConfigPanel
        config={config}
        onConfigChange={setConfig}
        gpxData={gpxData}
        onGPXLoaded={onGPXLoaded}
        gpxFileName={gpxFileName}
        onClearGPX={onClearGPX}
        onAnalyze={onAnalyze}
        isLoading={isLoading}
      />

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </aside>
  )
}
