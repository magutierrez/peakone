'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRouteAnalysis } from '@/hooks/use-route-analysis'
import type { RouteConfig } from '@/lib/types'

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
import { useEffect, useRef } from 'react'

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
  const [config, setConfig] = useState<RouteConfig>({
    date: getDefaultDate(),
    time: '08:00',
    speed: 25,
    activityType: 'cycling',
  })

  const [activeFilter, setActiveFilter] = useState<{
    key: 'pathType' | 'surface'
    value: string
  } | null>(null)
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* SIDEBAR: Fixed width configuration */}
        <Sidebar
          config={config}
          setConfig={setConfig}
          gpxData={gpxData}
          onGPXLoaded={handleGPXLoaded}
          gpxFileName={gpxFileName}
          onClearGPX={handleClearGPX}
          onReverseRoute={handleReverseRoute}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          error={error}
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
                        : gpxData.points
                            .filter((_, i) => i % 10 === 0)
                            .map((p) => ({ point: p, weather: {} }) as any)
                    }
                    selectedIndex={selectedPointIndex}
                    onSelect={setSelectedPointIndex}
                  />
                </section>

                {/* 3. Weather Data */}
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
          <div className="h-[50vh] w-full border-l border-border lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:w-[40%]">
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
