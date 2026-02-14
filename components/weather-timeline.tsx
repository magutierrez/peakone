'use client'

import type { RouteWeatherPoint } from '@/lib/types'
import { WeatherSummary } from './weather-timeline/weather-summary'
import { WeatherList } from './weather-timeline/weather-list'
import { ElevationProfile } from './weather-timeline/elevation-profile'
import { WeatherPointDetail } from './weather-timeline/weather-point-detail'

interface WeatherTimelineProps {
  weatherPoints: RouteWeatherPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export function WeatherTimeline({ weatherPoints, selectedIndex, onSelect }: WeatherTimelineProps) {
  if (weatherPoints.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <WeatherSummary weatherPoints={weatherPoints} />

      <WeatherList
        weatherPoints={weatherPoints} 
        selectedIndex={selectedIndex} 
        onSelect={onSelect} 
      />

      {selectedIndex !== null && weatherPoints[selectedIndex] && (
        <WeatherPointDetail point={weatherPoints[selectedIndex]} />
      )}
        <ElevationProfile
            weatherPoints={weatherPoints}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
        />
    </div>
  )
}