'use client'

import { Marker } from 'react-map-gl/maplibre'
import { WindArrow } from '@/components/wind-arrow'
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types'

interface MapMarkersProps {
  points: RoutePoint[]
  weatherPoints?: RouteWeatherPoint[]
  selectedPointIndex: number | null
  activeFilter?: { key: 'pathType' | 'surface', value: string } | null
  onPointSelect?: (index: number) => void
  onHoverPoint: (index: number | null) => void
}

export function MapMarkers({
  points,
  weatherPoints,
  selectedPointIndex,
  activeFilter,
  onPointSelect,
  onHoverPoint,
}: MapMarkersProps) {
  if (weatherPoints && weatherPoints.length > 0) {
    return (
      <>
        {weatherPoints.map((wp, idx) => {
          const isSelected = selectedPointIndex === idx
          const isFiltered = activeFilter && (wp[activeFilter.key] || 'unknown') !== activeFilter.value
          
          if (isFiltered && !isSelected) return null

          return (
            <Marker
              key={idx}
              longitude={wp.point.lon}
              latitude={wp.point.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation()
                onPointSelect?.(idx)
              }}
            >
              <button
                className={`group relative flex items-center justify-center transition-all hover:scale-125 ${isSelected ? 'z-10 scale-125' : 'z-0'}`}
                onMouseEnter={() => onHoverPoint(idx)}
                onMouseLeave={() => onHoverPoint(null)}
              >
                <WindArrow 
                  direction={wp.weather.windDirection}
                  travelBearing={wp.bearing}
                  effect={wp.windEffect}
                  size={isSelected ? 36 : 28}
                />
                {isSelected && (
                  <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-pulse" />
                )}
              </button>
            </Marker>
          )
        })}
      </>
    )
  }

  if (points.length > 0) {
    return (
      <>
        <Marker longitude={points[0].lon} latitude={points[0].lat} color="#3ecf8e" />
        <Marker longitude={points[points.length - 1].lon} latitude={points[points.length - 1].lat} color="#ef4444" />
      </>
    )
  }

  return null
}
