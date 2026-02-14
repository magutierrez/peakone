'use client'

import { Bike, Footprints, Calendar, Clock, Gauge } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GPXUpload } from '@/components/gpx-upload'
import type { RouteConfig, GPXData } from '@/lib/types'

interface RouteConfigPanelProps {
  config: RouteConfig
  onConfigChange: (config: RouteConfig) => void
  gpxData: GPXData | null
  onGPXLoaded: (content: string, fileName: string) => void
  gpxFileName: string | null
  onClearGPX: () => void
  onAnalyze: () => void
  isLoading: boolean
}

export function RouteConfigPanel({
  config,
  onConfigChange,
  gpxData,
  onGPXLoaded,
  gpxFileName,
  onClearGPX,
  onAnalyze,
  isLoading,
}: RouteConfigPanelProps) {
  const t = useTranslations('RouteConfigPanel')
  const estimatedDuration = gpxData
    ? (gpxData.totalDistance / config.speed) * 60
    : 0
  const hours = Math.floor(estimatedDuration / 60)
  const minutes = Math.round(estimatedDuration % 60)

  return (
    <div className="flex flex-col gap-5">
      {/* GPX Upload */}
      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('gpxFile')}
        </Label>
        <GPXUpload
          onFileLoaded={onGPXLoaded}
          fileName={gpxFileName}
          onClear={onClearGPX}
        />
      </div>

      {/* Route Stats */}
      {gpxData && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="text-lg font-bold text-foreground font-mono">
              {gpxData.totalDistance.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">{t('km')}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="text-lg font-bold text-primary font-mono">
              +{Math.round(gpxData.totalElevationGain)}
            </p>
            <p className="text-xs text-muted-foreground">{t('elevationGain')}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-center">
            <p className="text-lg font-bold text-destructive font-mono">
              -{Math.round(gpxData.totalElevationLoss)}
            </p>
            <p className="text-xs text-muted-foreground">{t('elevationLoss')}</p>
          </div>
        </div>
      )}

      {/* Activity Type */}
      <div>
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('activity')}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              onConfigChange({ ...config, activityType: 'cycling', speed: 25 })
            }
            className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all ${
              config.activityType === 'cycling'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
            }`}
          >
            <Bike className="h-4 w-4" />
            {t('cycling')}
          </button>
          <button
            onClick={() =>
              onConfigChange({ ...config, activityType: 'walking', speed: 5 })
            }
            className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all ${
              config.activityType === 'walking'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
            }`}
          >
            <Footprints className="h-4 w-4" />
            {t('walking')}
          </button>
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label
            htmlFor="date"
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Calendar className="h-3.5 w-3.5" />
            {t('date')}
          </Label>
          <Input
            id="date"
            type="date"
            value={config.date}
            onChange={(e) => onConfigChange({ ...config, date: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div>
          <Label
            htmlFor="time"
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Clock className="h-3.5 w-3.5" />
            {t('startTime')}
          </Label>
          <Input
            id="time"
            type="time"
            value={config.time}
            onChange={(e) => onConfigChange({ ...config, time: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {/* Speed */}
      <div>
        <Label
          htmlFor="speed"
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <Gauge className="h-3.5 w-3.5" />
          {t('averageSpeed')}
        </Label>
        <Input
          id="speed"
          type="number"
          min={1}
          max={60}
          value={config.speed}
          onChange={(e) =>
            onConfigChange({ ...config, speed: parseFloat(e.target.value) || 1 })
          }
          className="bg-secondary border-border font-mono"
        />
      </div>

      {/* Estimated Duration */}
      {gpxData && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t('estimatedDuration')}</p>
          <p className="text-lg font-bold text-foreground font-mono">
            {t('durationFormat', { hours, minutes: minutes.toString().padStart(2, '0') })}
          </p>
        </div>
      )}

      {/* Analyze Button */}
      <Button
        onClick={onAnalyze}
        disabled={!gpxData || isLoading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {t('analyzing')}
          </span>
        ) : (
          t('analyze')
        )}
      </Button>
    </div>
  )
}
