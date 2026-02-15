'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { WeatherTimeline } from '@/components/weather-timeline'
import { useRouteAnalysis } from '@/hooks/use-route-analysis'
import type { RouteConfig } from '@/lib/types'

// Components
import { Header } from './_components/header'
import { Sidebar } from './_components/sidebar'
import { EmptyState } from './_components/empty-state'

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const t = useTranslations('HomePage')
    return (
      <div className="flex h-full items-center justify-center bg-card">
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

      <div className="flex flex-1 flex-col lg:flex-row">
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

        <main className="flex flex-1 flex-col min-w-0">
          <div className="h-[40vh] lg:h-[50vh]">
            <RouteMap
              points={gpxData?.points || []}
              weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
              selectedPointIndex={selectedPointIndex}
              onPointSelect={setSelectedPointIndex}
              activeFilter={activeFilter}
            />
          </div>

          <div className="flex-1 overflow-y-auto border-t border-border bg-background p-4">
            {weatherPoints.length > 0 ? (
              <WeatherTimeline
                weatherPoints={weatherPoints}
                selectedIndex={selectedPointIndex}
                onSelect={setSelectedPointIndex}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}