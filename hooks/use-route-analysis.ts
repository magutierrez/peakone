'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  parseGPX,
  sampleRoutePoints,
  calculateBearing,
  getWindEffect,
  reverseGPXData,
} from '@/lib/gpx-parser'
import type { GPXData, RouteConfig, RouteWeatherPoint, WeatherData } from '@/lib/types'

export function useRouteAnalysis(config: RouteConfig) {
  const t = useTranslations('HomePage')
  const [gpxData, setGPXData] = useState<GPXData | null>(null)
  const [gpxFileName, setGPXFileName] = useState<string | null>(null)
  const [rawGPXContent, setRawGPXContent] = useState<string | null>(null)
  const [weatherPoints, setWeatherPoints] = useState<RouteWeatherPoint[]>([])
  const [routeInfoData, setRouteInfoData] = useState<any[]>([])
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReverseRoute = useCallback(() => {
    if (!gpxData) return
    const reversed = reverseGPXData(gpxData)
    setGPXData(reversed)
    setWeatherPoints([]) // Reset weather as it's no longer accurate for reversed direction
    setSelectedPointIndex(null)
  }, [gpxData])

  const handleStravaActivityLoaded = useCallback((data: GPXData, fileName: string) => {
    setGPXData(data)
    setGPXFileName(fileName)
    setRawGPXContent(null) // Strava data is already parsed, we don't have raw GPX
    setWeatherPoints([])
    setSelectedPointIndex(null)
    setError(null)
  }, [])

  // Fetch route info (OSM) as soon as GPX is loaded
  useEffect(() => {
    if (!gpxData) {
      setRouteInfoData([])
      return
    }

    const fetchRouteInfo = async () => {
      try {
        const response = await fetch('/api/route-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: sampleRoutePoints(gpxData.points, 24).map((p) => ({ 
              lat: p.lat, 
              lon: p.lon,
              distanceFromStart: p.distanceFromStart 
            })),
          }),
        })
        if (response.ok) {
          const data = await response.json()
          setRouteInfoData(data.pathData || [])
        }
      } catch (e) {
        console.error('Failed to fetch route info')
      }
    }

    fetchRouteInfo()
  }, [gpxData])

  const handleGPXLoaded = useCallback(
    (content: string, fileName: string) => {
      try {
        const data = parseGPX(content)
        if (data.points.length < 2) {
          setError(t('errors.insufficientPoints'))
          return
        }
        setGPXData(data)
        setGPXFileName(fileName)
        setRawGPXContent(content)
        setWeatherPoints([])
        setSelectedPointIndex(null)
        setError(null)
      } catch {
        setError(t('errors.readError'))
      }
    },
    [t],
  )

  const handleClearGPX = useCallback(() => {
    setGPXData(null)
    setGPXFileName(null)
    setRawGPXContent(null)
    setWeatherPoints([])
    setRouteInfoData([])
    setSelectedPointIndex(null)
    setError(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!gpxData) return
    setIsLoading(true)
    setError(null)

    const fetchWithRetry = async (
      url: string,
      options: RequestInit,
      maxRetries = 3,
    ): Promise<Response> => {
      let lastError: Error | null = null
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, options)
          if (response.status === 429) {
            const waitTime = Math.pow(2, i) * 1000
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            continue
          }
          return response
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error')
          const waitTime = Math.pow(2, i) * 1000
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }
      throw lastError || new Error('Retry limit reached')
    }

    try {
      const sampled = sampleRoutePoints(gpxData.points, 24)
      const startTime = new Date(`${config.date}T${config.time}:00`)
      const pointsWithTime = sampled.map((point) => {
        const hoursElapsed = point.distanceFromStart / config.speed
        return {
          ...point,
          estimatedTime: new Date(startTime.getTime() + hoursElapsed * 3600000),
        }
      })

      const response = await fetchWithRetry('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: pointsWithTime.map((p) => ({
            lat: p.lat,
            lon: p.lon,
            estimatedTime: p.estimatedTime.toISOString(),
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(
          response.status === 429 ? t('errors.tooManyRequests') : t('errors.weatherFetchError'),
        )
      }

      const weatherDataObj = await response.json()
      const weatherData: WeatherData[] = weatherDataObj.weather

      const routeWeatherPoints: RouteWeatherPoint[] = pointsWithTime.map((point, idx) => {
        const nextPoint = pointsWithTime[Math.min(idx + 1, pointsWithTime.length - 1)]
        const bearing = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon)
        const weather = weatherData[idx]
        const windResult = getWindEffect(bearing, weather.windDirection)

        // Match with route info
        const info = routeInfoData[idx] || {}

        return {
          point: {
            ...point,
            ele: point.ele || info.elevation, // Fallback to OSM/Meteo elevation
          },
          weather,
          windEffect: windResult.effect,
          windEffectAngle: windResult.angle,
          bearing,
          pathType: info.pathType,
          surface: info.surface,
        }
      })

      setWeatherPoints(routeWeatherPoints)
      setSelectedPointIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknownError'))
    } finally {
      setIsLoading(false)
    }
  }, [gpxData, config, t, routeInfoData])

  return {
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
  }
}
