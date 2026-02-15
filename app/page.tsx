'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRouteAnalysis } from '@/hooks/use-route-analysis'
import type { RouteConfig } from '@/lib/types'

// Components
import { Header } from './_components/header'
import { EmptyState } from './_components/empty-state'
import { RouteConfigPanel } from '@/components/route-config-panel'
import { WeatherSummary } from '@/components/weather-timeline/weather-summary'
import { WeatherList } from '@/components/weather-timeline/weather-list'
import { WeatherPointDetail } from '@/components/weather-timeline/weather-point-detail'
import { ElevationProfile } from '@/components/weather-timeline/elevation-profile'
import { RouteSegments } from '@/components/weather-timeline/route-segments'
import {Sidebar} from "@/app/_components/sidebar";

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const t = useTranslations('HomePage')
    return (
      <div className="flex h-full items-center justify-center bg-card rounded-lg">
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

export default function HomePage() {
  const [config, setConfig] = useState<RouteConfig>({
    date: getDefaultDate(),
    time: '08:00',
    speed: 25,
    activityType: 'cycling',
  })

  const [activeFilter, setActiveFilter] = useState<{ key: 'pathType' | 'surface', value: string } | null>(null)

  const {
    gpxData,
    gpxFileName,
    weatherPoints,
    routeInfoData,
    selectedPointIndex,
    setSelectedPointIndex,
    isLoading,
    error,
    handleGPXLoaded,
    handleClearGPX,
    handleAnalyze,
  } = useRouteAnalysis(config)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 flex-col lg:flex-row min-h-0">
        <Sidebar
          config={config}
          setConfig={setConfig}
          gpxData={gpxData}
          gpxFileName={gpxFileName}
          isLoading={isLoading}
          error={error}
          onGPXLoaded={handleGPXLoaded}
          onClearGPX={handleClearGPX}
          onAnalyze={handleAnalyze}
        />

        <main className="flex-1 flex flex-col lg:flex-row min-w-0">
          <div className="w-full lg:w-[60%] p-6 md:p-8 flex flex-col gap-10">
            {!gpxData ? (
              <EmptyState />
            ) : (
              <>
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Terreno y Vía</h3>
                  </div>
                  <RouteSegments 
                    weatherPoints={weatherPoints.length > 0 ? weatherPoints : routeInfoData.map(d => ({ ...d, point: d }))} 
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                  />
                </section>

                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Altitud</h3>
                  </div>
                  <ElevationProfile 
                    weatherPoints={weatherPoints.length > 0 ? weatherPoints : gpxData.points.filter((_, i) => i % 10 === 0).map(p => ({ point: p, weather: {} } as any))} 
                    selectedIndex={selectedPointIndex} 
                    onSelect={setSelectedPointIndex} 
                  />
                </section>

                {weatherPoints.length > 0 && (
                  <section className="flex flex-col gap-8">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <div className="h-4 w-1 bg-primary rounded-full" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">Análisis Meteorológico</h3>
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

          <div className="w-full lg:w-[40%] h-[50vh] lg:h-[calc(100vh-57px)] lg:sticky lg:top-[57px] border-l border-border">
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
