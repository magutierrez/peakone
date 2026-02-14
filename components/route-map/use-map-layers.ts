import { useMemo } from 'react'
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types'
import type { Feature, LineString, MultiLineString } from 'geojson'

export function useMapLayers(
  points: RoutePoint[],
  weatherPoints?: RouteWeatherPoint[],
  activeFilter?: { key: 'pathType' | 'surface', value: string } | null
) {
  const routeData = useMemo<Feature<LineString> | null>(() => {
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

  const highlightedData = useMemo<Feature<MultiLineString> | null>(() => {
    if (!activeFilter || !weatherPoints || weatherPoints.length < 2) return null

    const segments: number[][][] = []
    let currentSegment: number[][] = []

    weatherPoints.forEach((wp, i) => {
      const matches = (wp[activeFilter.key] || 'unknown') === activeFilter.value
      
      if (matches) {
        currentSegment.push([wp.point.lon, wp.point.lat])
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

  return { routeData, highlightedData }
}
