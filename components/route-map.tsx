'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import Map, { Source, Layer, Marker, Popup, NavigationControl, MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { WindArrow } from '@/components/wind-arrow'
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types'
import { WEATHER_CODES } from '@/lib/types'

interface RouteMapProps {
  points: RoutePoint[]
  weatherPoints?: RouteWeatherPoint[]
  selectedPointIndex?: number | null
  onPointSelect?: (index: number) => void
  activeFilter?: { key: 'pathType' | 'surface', value: string } | null
}

export default function RouteMap({ 
  points, 
  weatherPoints, 
  selectedPointIndex, 
  onPointSelect,
  activeFilter 
}: RouteMapProps) {
  const t = useTranslations('RouteMap')
  const tTimeline = useTranslations('WeatherTimeline')
  const tw = useTranslations('WeatherCodes')
  const { resolvedTheme } = useTheme()
  const mapRef = useRef<MapRef>(null)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure theme is available before rendering the map to avoid mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const mapStyle = useMemo(() => {
    return resolvedTheme === 'light'
      ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  }, [resolvedTheme])

  // Original route
  const routeData = useMemo(() => {
    if (points.length === 0) return null
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: points.map((p) => [p.lon, p.lat]),
      },
    }
  }, [points])

  // Highlighted segments based on active filter
  const highlightedData = useMemo(() => {
    if (!activeFilter || !weatherPoints || weatherPoints.length < 2) return null

    const segments: number[][][] = []
    let currentSegment: number[][] = []

    weatherPoints.forEach((wp, i) => {
      const matches = (wp[activeFilter.key] || 'unknown') === activeFilter.value
      
      if (matches) {
        currentSegment.push([wp.point.lon, wp.point.lat])
        // To make the segment continuous, we often need to include the next point
        if (i < weatherPoints.length - 1) {
          const nextWp = weatherPoints[i+1]
          currentSegment.push([nextWp.point.lon, nextWp.point.lat])
        }
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment)
          currentSegment = []
        }
      }
    })

    if (currentSegment.length > 0) segments.push(currentSegment)

    if (segments.length === 0) return null

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiLineString',
        coordinates: segments,
      },
    }
  }, [activeFilter, weatherPoints])

  // Fit map to bounds when points change
  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      const lons = points.map(p => p.lon)
      const lats = points.map(p => p.lat)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      
      mapRef.current.fitBounds(
        [[minLon, minLat], [maxLon, maxLat]],
        { padding: 40, duration: 1000 }
      )
    }
  }, [points])

  // Sync map center with selected point
  useEffect(() => {
    if (selectedPointIndex !== null && weatherPoints?.[selectedPointIndex] && mapRef.current) {
      const point = weatherPoints[selectedPointIndex].point
      mapRef.current.easeTo({
        center: [point.lon, point.lat],
        duration: 500
      })
    }
  }, [selectedPointIndex, weatherPoints])

  const popupInfo = useMemo(() => {
    const idx = hoveredPointIndex !== null ? hoveredPointIndex : selectedPointIndex
    if (idx !== null && weatherPoints?.[idx]) {
      return {
        ...weatherPoints[idx],
        index: idx
      }
    }
    return null
  }, [hoveredPointIndex, selectedPointIndex, weatherPoints])

  if (!mounted) return null

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: -3.7038,
          latitude: 40.4168,
          zoom: 5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
      >
        <NavigationControl position="top-right" />

        {routeData && (
          <Source id="route-source" type="geojson" data={routeData as any}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': '#3ecf8e',
                'line-width': 3,
                'line-opacity': activeFilter ? 0.2 : 0.8
              }}
            />
          </Source>
        )}

        {highlightedData && (
          <Source id="highlight-source" type="geojson" data={highlightedData as any}>
            <Layer
              id="highlight-layer"
              type="line"
              paint={{
                'line-color': '#3ecf8e',
                'line-width': 6,
                'line-opacity': 1,
                'line-blur': 2
              }}
            />
            <Layer
              id="highlight-layer-inner"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Weather Markers as WindArrows */}
        {weatherPoints && weatherPoints.length > 0 ? (
          weatherPoints.map((wp, idx) => {
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
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
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
          })
        ) : points.length > 0 && (
          <>
            <Marker longitude={points[0].lon} latitude={points[0].lat} color="#3ecf8e" />
            <Marker longitude={points[points.length - 1].lon} latitude={points[points.length - 1].lat} color="#ef4444" />
          </>
        )}

        {/* Custom Popup for Weather Info */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.point.lon}
            latitude={popupInfo.point.lat}
            anchor="bottom"
            onClose={() => setHoveredPointIndex(null)}
            closeButton={false}
            maxWidth="240px"
            className="weather-popup"
            offset={15}
          >
            <div className="p-1 text-xs leading-relaxed text-foreground">
              <div className="mb-1 flex items-center justify-between border-b border-border pb-1">
                <strong className="font-mono">
                  {new Date(popupInfo.weather.time).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
                <span className="text-muted-foreground">km {popupInfo.point.distanceFromStart.toFixed(1)}</span>
              </div>
              <div className="font-medium">
                {tw.raw(popupInfo.weather.weatherCode.toString()) 
                  ? tw(popupInfo.weather.weatherCode.toString() as any) 
                  : (WEATHER_CODES[popupInfo.weather.weatherCode]?.description || tTimeline('unknownWeather'))}
              </div>
              <div className="mt-0.5 flex items-center justify-between">
                <span>{popupInfo.weather.temperature}°C</span>
                <span className="text-muted-foreground">
                  {t('tooltip.wind')}: {popupInfo.weather.windSpeed} km/h
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <style jsx global>{`
        .weather-popup .maplibregl-popup-content {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        .weather-popup .maplibregl-popup-tip {
          border-top-color: hsl(var(--border)) !important;
        }
      `}</style>

      {/* Legend */}
      {weatherPoints && weatherPoints.length > 0 && (
        <div className="absolute bottom-6 left-3 z-10 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold text-foreground">{t('legend.title')}</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-xs text-muted-foreground">{t('legend.tailwind')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-xs text-muted-foreground">{t('legend.headwind')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-xs text-muted-foreground">{t('legend.crosswind')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
