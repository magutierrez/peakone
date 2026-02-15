'use client'

import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { GPXUpload } from '@/components/gpx-upload'
import type { GPXData } from '@/lib/types'

interface RouteConfigPanelProps {
  gpxData: GPXData | null
  onGPXLoaded: (content: string, fileName: string) => void
  gpxFileName: string | null
  onClearGPX: () => void
  onReverseRoute: () => void
}

export function RouteConfigPanel({
  gpxData,
  onGPXLoaded,
  gpxFileName,
  onClearGPX,
  onReverseRoute,
}: RouteConfigPanelProps) {
  const t = useTranslations('RouteConfigPanel')

  return (
    <div className="flex flex-col gap-5">
      {/* GPX Upload */}
      <div className="mb-2 flex items-center justify-between">
        <Label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('gpxFile')}
        </Label>
        {gpxData && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-[10px] text-muted-foreground hover:text-primary"
            onClick={onReverseRoute}
          >
            <span className="rotate-90">⇄</span> Invertir sentido
          </Button>
        )}
      </div>
      <div>
        <GPXUpload onFileLoaded={onGPXLoaded} fileName={gpxFileName} onClear={onClearGPX} />
      </div>

      {/* Route Stats */}
      {gpxData && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="font-mono text-lg font-bold text-foreground">
              {gpxData.totalDistance.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">{t('km')}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="font-mono text-lg font-bold text-primary">
              +{Math.round(gpxData.totalElevationGain)}
            </p>
            <p className="text-xs text-muted-foreground">{t('elevationGain')}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="font-mono text-lg font-bold text-destructive">
              -{Math.round(gpxData.totalElevationLoss)}
            </p>
            <p className="text-xs text-muted-foreground">{t('elevationLoss')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
