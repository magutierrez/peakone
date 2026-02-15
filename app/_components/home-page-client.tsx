'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRouteAnalysis } from '@/hooks/use-route-analysis'
import type { RouteConfig } from '@/lib/types'
import { Bike, Footprints, Calendar as CalendarIcon, Clock, Gauge } from 'lucide-react'

// Components
import { Header } from './header'
import { EmptyState } from './empty-state'
import { WeatherSummary } from '@/components/weather-timeline/weather-summary'
import { WeatherList } from '@/components/weather-timeline/weather-list'
import { WeatherPointDetail } from '@/components/weather-timeline/weather-point-detail'
import { ElevationProfile } from '@/components/weather-timeline/elevation-profile'
import { RouteSegments } from '@/components/weather-timeline/route-segments'
import { Sidebar } from './sidebar'
import { Session } from 'next-auth'
import { useSavedRoutes } from '@/hooks/use-saved-routes'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const t = useTranslations('HomePage')
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-card">
        <span className="text-sm text-muted-foreground">{t('loadingMap')}</span>
      </div>
    )
  },
})

function getDefaultDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

interface HomePageClientProps {
  session: Session | null
}

export default function HomePageClient({ session }: HomePageClientProps) {
  const t = useTranslations('RouteConfigPanel')
  const [config, setConfig] = useState<RouteConfig>({
    date: getDefaultDate(),
    time: '08:00',
    speed: 25,
    activityType: 'cycling',
  })

  const [activeFilter, setActiveFilter] = useState<{ key: 'pathType' | 'surface'; value: string } | null>(
    null,
  )
  const { saveRoute, routes } = useSavedRoutes()
  const lastSavedRef = useRef<string | null>(null)

  const {
    gpxData,
    gpxFileName,
    rawGPXContent,
    weatherPoints,
    routeInfoData,
    selectedPointIndex,
    setSelectedPointIndex,
    isLoading,
    error,
    handleGPXLoaded,
    handleStravaActivityLoaded,
    handleClearGPX,
    handleReverseRoute,
    handleAnalyze,
  } = useRouteAnalysis(config)

  // AUTO-SAVE logic
  useEffect(() => {
    if (gpxData && rawGPXContent && gpxFileName && session?.user?.email) {
      const routeExists = routes.some(
        (r) =>
          r.name === gpxFileName &&
          Number(r.distance).toFixed(2) === gpxData.totalDistance.toFixed(2),
      )

      if (!routeExists && lastSavedRef.current !== rawGPXContent) {
        saveRoute(gpxFileName, rawGPXContent, gpxData.totalDistance, gpxData.totalElevationGain)
        lastSavedRef.current = rawGPXContent
      }
    }
  }, [gpxData, rawGPXContent, gpxFileName, session?.user?.email, routes, saveRoute])

  const estimatedDuration = gpxData ? (gpxData.totalDistance / config.speed) * 60 : 0
  const hours = Math.floor(estimatedDuration / 60)
  const minutes = Math.round(estimatedDuration % 60)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* SIDEBAR: Fixed width configuration */}
        <Sidebar
          gpxData={gpxData}
          onGPXLoaded={handleGPXLoaded}
          onStravaActivityLoaded={handleStravaActivityLoaded}
          gpxFileName={gpxFileName}
          onClearGPX={handleClearGPX}
          onReverseRoute={handleReverseRoute}
          error={error}
          provider={session?.provider}
        />

        {/* MAIN AREA: Split 60/40 */}
        <main className="flex min-w-0 flex-1 flex-col lg:flex-row">
          {/* Data Column (60%) */}
          <div className="flex w-full flex-col gap-10 p-6 md:p-8 lg:w-[60%]">
            {!gpxData ? (
              <EmptyState />
            ) : (
              <>
                {/* 1. Path Segments */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                      Terreno y Vía
                    </h3>
                  </div>
                  <RouteSegments
                    weatherPoints={
                      weatherPoints.length > 0
                        ? weatherPoints
                        : routeInfoData.map((d) => ({ ...d, point: d }))
                    }
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                </section>

                {/* 2. Elevation Profile */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                      Altitud
                    </h3>
                  </div>
                  <ElevationProfile
                    weatherPoints={
                      weatherPoints.length > 0
                        ? weatherPoints
                        : routeInfoData.length > 0
                          ? routeInfoData.map((d) => ({
                              point: {
                                ...d,
                                ele: d.elevation,
                                distanceFromStart: d.distanceFromStart || 0,
                              },
                              weather: {},
                            } as any))
                          : gpxData.points
                              .filter((_, i) => i % 10 === 0)
                              .map((p) => ({ point: p, weather: {} } as any))
                    }
                    selectedIndex={selectedPointIndex}
                    onSelect={setSelectedPointIndex}
                  />
                </section>

                {/* 3. Activity Configuration (Moved from sidebar) */}
                <section className="flex flex-col gap-6 rounded-xl border border-border bg-card/50 p-6">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                      Configuración de la Actividad
                    </h3>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Activity Type */}
                    <div className="flex flex-col gap-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('activity')}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setConfig({ ...config, activityType: 'cycling', speed: 25 })}
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
                          onClick={() => setConfig({ ...config, activityType: 'walking', speed: 5 })}
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

                    {/* Speed */}
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="speed" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Gauge className="h-3.5 w-3.5" />
                        {t('averageSpeed')}
                      </Label>
                      <div className="flex items-center gap-3">
                        <Input
                          id="speed"
                          type="number"
                          min={1}
                          max={60}
                          value={config.speed}
                          onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) || 1 })}
                          className="font-mono border-border bg-secondary"
                        />
                        <div className="rounded-lg border border-border bg-muted/50 px-4 py-2 shrink-0">
                          <p className="text-[10px] text-muted-foreground uppercase">{t('estimatedDuration')}</p>
                          <p className="font-mono text-sm font-bold text-foreground whitespace-nowrap">
                            {t('durationFormat', { hours, minutes: minutes.toString().padStart(2, '0') })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="date" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {t('date')}
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={config.date}
                        onChange={(e) => setConfig({ ...config, date: e.target.value })}
                        className="border-border bg-secondary"
                      />
                    </div>

                    {/* Time */}
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="time" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {t('startTime')}
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={config.time}
                        onChange={(e) => setConfig({ ...config, time: e.target.value })}
                        className="border-border bg-secondary"
                      />
                    </div>
                  </div>

                  {/* Analyze Button */}
                  <div className="pt-4 border-t border-border mt-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={!gpxData || isLoading}
                      className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
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
                </section>

                {/* 4. Weather Data */}
                {weatherPoints.length > 0 && (
                  <section className="flex flex-col gap-8">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <div className="h-4 w-1 rounded-full bg-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                        Análisis Meteorológico
                      </h3>
                    </div>
                    <WeatherSummary weatherPoints={weatherPoints} />
                    <WeatherList
                      weatherPoints={weatherPoints}
                      selectedIndex={selectedPointIndex}
                      onSelect={setSelectedPointIndex}
                    />
                    {selectedPointIndex !== null && weatherPoints[selectedPointIndex] && (
                      <WeatherPointDetail point={weatherPoints[selectedPointIndex]} />
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          {/* Sticky Map Column (40%) */}
          <div className="sticky top-[57px] h-[50vh] w-full border-l border-border lg:h-[calc(100vh-57px)] lg:w-[40%]">
            <RouteMap
              points={gpxData?.points || []}
              weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
              selectedPointIndex={selectedPointIndex}
              onPointSelect={setSelectedPointIndex}
              activeFilter={activeFilter}
            />
          </div>
        </main>
      </div>
    </div>
  )
}