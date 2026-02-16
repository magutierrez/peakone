import { useMemo } from 'react'
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types'
import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson'

export function useMapLayers(
  points: RoutePoint[],
  weatherPoints?: RouteWeatherPoint[],
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null,
  selectedRange?: { start: number; end: number } | null,
) {
  const routeData = useMemo<Feature<LineString> | null>(() => {
    if (points.length === 0) return null
    const validPoints = points.filter(
      (p) =>
        typeof p.lon === 'number' && typeof p.lat === 'number' && !isNaN(p.lon) && !isNaN(p.lat),
    )
    if (validPoints.length < 2) return null

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: validPoints.map((p) => [p.lon, p.lat]),
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
          currentSegment.push([weatherPoints[i + 1].point.lon, weatherPoints[i + 1].point.lat])
        }
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment)
          currentSegment = []
        }
      }
    })
    if (currentSegment.length > 0) segments.push(currentSegment)
    return segments.length > 0
      ? {
          type: 'Feature',
          properties: {},
          geometry: { type: 'MultiLineString', coordinates: segments },
        }
      : null
  }, [activeFilter, weatherPoints])

  const rangeHighlightData = useMemo<Feature<LineString> | null>(() => {
    if (!selectedRange || points.length < 2) return null

    const rangePoints = points.filter(
      (p) =>
        typeof p.lon === 'number' &&
        typeof p.lat === 'number' &&
        !isNaN(p.lon) &&
        !isNaN(p.lat) &&
        p.distanceFromStart >= selectedRange.start &&
        p.distanceFromStart <= selectedRange.end,
    )

    if (rangePoints.length < 2) return null

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: rangePoints.map((p) => [p.lon, p.lat]),
      },
    }
  }, [selectedRange, points])

  const weatherPointsData = useMemo<FeatureCollection<Point> | null>(() => {
    if (!weatherPoints || weatherPoints.length === 0) return null

    const validWeatherPoints = weatherPoints.filter(
      (wp) =>
        wp.point &&
        typeof wp.point.lon === 'number' &&
        typeof wp.point.lat === 'number' &&
        !isNaN(wp.point.lon) &&
        !isNaN(wp.point.lat),
    )

    if (validWeatherPoints.length === 0) return null

    return {
      type: 'FeatureCollection',
      features: validWeatherPoints.map((wp, idx) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [wp.point.lon, wp.point.lat] },
        properties: {
          index: idx,
          bearing: typeof wp.weather.windDirection === 'number' ? wp.weather.windDirection : 0,
          effect: wp.windEffect,
          pathType: wp.pathType || 'unknown',
          surface: wp.surface || 'unknown',
          distanceFromStart: wp.point.distanceFromStart,
        },
      })),
    }
  }, [weatherPoints])

  const markerData = useMemo<FeatureCollection<Point> | null>(() => {
    if (points.length < 2) return null

    const start = points[0]
    const end = points[points.length - 1]

    const features: Feature<Point>[] = []

    if (
      typeof start.lon === 'number' &&
      typeof start.lat === 'number' &&
      !isNaN(start.lon) &&
      !isNaN(start.lat)
    ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [start.lon, start.lat] },
        properties: { label: 'A', type: 'start' },
      })
    }

    if (
      typeof end.lon === 'number' &&
      typeof end.lat === 'number' &&
      !isNaN(end.lon) &&
      !isNaN(end.lat)
    ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [end.lon, end.lat] },
        properties: { label: 'B', type: 'end' },
      })
    }

    return { type: 'FeatureCollection', features }
  }, [points])

  return { routeData, highlightedData, rangeHighlightData, weatherPointsData, markerData }
}
