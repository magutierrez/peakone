'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import Map, { Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import type { RoutePoint, RouteWeatherPoint } from '@/lib/types'
import { useMapLayers } from './route-map/use-map-layers'
import { MapMarkers } from './route-map/map-markers'
import { MapPopup } from './route-map/map-popup'
import { MapLegend } from './route-map/map-legend'

interface RouteMapProps {
  points: RoutePoint[]
  weatherPoints?: RouteWeatherPoint[]
  selectedPointIndex?: number | null
  onPointSelect?: (index: number) => void
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null
}

export default function RouteMap({
  points,
  weatherPoints,
  selectedPointIndex = null,
  onPointSelect,
  activeFilter = null,
}: RouteMapProps) {
  const { resolvedTheme } = useTheme()
  const mapRef = useRef<MapRef>(null)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  const { routeData, highlightedData } = useMapLayers(points, weatherPoints, activeFilter)

  useEffect(() => {
    setMounted(true)
  }, [])

  const mapStyle = useMemo(() => {
    return resolvedTheme === 'light'
      ? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  }, [resolvedTheme])

  // Fit map to bounds
  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      const lons = points.map((p) => p.lon)
      const lats = points.map((p) => p.lat)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      mapRef.current.fitBounds(
        [
          [minLon, minLat],
          [maxLon, maxLat],
        ],
        { padding: 40, duration: 1000 },
      )
    }
  }, [points])

  // Sync center with selected point
  useEffect(() => {
    if (selectedPointIndex !== null && weatherPoints?.[selectedPointIndex] && mapRef.current) {
      const point = weatherPoints[selectedPointIndex].point
      mapRef.current.easeTo({
        center: [point.lon, point.lat],
        duration: 500,
      })
    }
  }, [selectedPointIndex, weatherPoints])

  const popupInfo = useMemo(() => {
    const idx = hoveredPointIndex !== null ? hoveredPointIndex : selectedPointIndex
    if (idx !== null && weatherPoints?.[idx]) {
      return {
        ...weatherPoints[idx],
        index: idx,
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
          zoom: 5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
      >
        <NavigationControl position="top-right" />

        {routeData && (
          <Source id="route-source" type="geojson" data={routeData}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': '#3ecf8e',
                'line-width': 3,
                'line-opacity': activeFilter ? 0.2 : 0.8,
              }}
            />
          </Source>
        )}

        {highlightedData && (
          <Source id="highlight-source" type="geojson" data={highlightedData}>
            <Layer
              id="highlight-layer"
              type="line"
              paint={{
                'line-color': '#3ecf8e',
                'line-width': 6,
                'line-opacity': 1,
                'line-blur': 2,
              }}
            />
            <Layer
              id="highlight-layer-inner"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 2,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        <MapMarkers
          points={points}
          weatherPoints={weatherPoints}
          selectedPointIndex={selectedPointIndex}
          activeFilter={activeFilter}
          onPointSelect={onPointSelect}
          onHoverPoint={setHoveredPointIndex}
        />

        {popupInfo && <MapPopup popupInfo={popupInfo} onClose={() => setHoveredPointIndex(null)} />}
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

      {weatherPoints && weatherPoints.length > 0 && <MapLegend />}
    </div>
  )
}
