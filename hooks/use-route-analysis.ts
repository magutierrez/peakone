import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { parseGPX, sampleRoutePoints, calculateBearing, getWindEffect } from '@/lib/gpx-parser'
import type { GPXData, RouteConfig, RouteWeatherPoint, WeatherData } from '@/lib/types'

export function useRouteAnalysis(config: RouteConfig) {
  const t = useTranslations('HomePage')
  const [gpxData, setGPXData] = useState<GPXData | null>(null)
  const [gpxFileName, setGPXFileName] = useState<string | null>(null)
  const [weatherPoints, setWeatherPoints] = useState<RouteWeatherPoint[]>([])
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGPXLoaded = useCallback((content: string, fileName: string) => {
    try {
      const data = parseGPX(content)
      if (data.points.length < 2) {
        setError(t('errors.insufficientPoints'))
        return
      }
      setGPXData(data)
      setGPXFileName(fileName)
      setWeatherPoints([])
      setSelectedPointIndex(null)
      setError(null)
    } catch {
      setError(t('errors.readError'))
    }
  }, [t])

  const handleClearGPX = useCallback(() => {
    setGPXData(null)
    setGPXFileName(null)
    setWeatherPoints([])
    setSelectedPointIndex(null)
    setError(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!gpxData) return
    setIsLoading(true)
    setError(null)

    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
      let lastError: Error | null = null
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, options)
          if (response.status === 429) {
            const waitTime = Math.pow(2, i) * 1000
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
          return response
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error')
          const waitTime = Math.pow(2, i) * 1000
          await new Promise(resolve => setTimeout(resolve, waitTime))
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
          estimatedTime: new Date(startTime.getTime() + hoursElapsed * 3600000)
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
        throw new Error(response.status === 429 ? t('errors.tooManyRequests') : t('errors.weatherFetchError'))
      }

      const data = await response.json()
      const weatherData: WeatherData[] = data.weather

      const routeWeatherPoints: RouteWeatherPoint[] = pointsWithTime.map((point, idx) => {
        const nextPoint = pointsWithTime[Math.min(idx + 1, pointsWithTime.length - 1)]
        const bearing = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon)
        const weather = weatherData[idx]
        const windResult = getWindEffect(bearing, weather.windDirection)

        return {
          point,
          weather,
          windEffect: windResult.effect,
          windEffectAngle: windResult.angle,
          bearing,
        }
      })

      setWeatherPoints(routeWeatherPoints)
      setSelectedPointIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknownError'))
    } finally {
      setIsLoading(false)
    }
  }, [gpxData, config, t])

  return {
    gpxData,
    gpxFileName,
    weatherPoints,
    selectedPointIndex,
    setSelectedPointIndex,
    isLoading,
    error,
    handleGPXLoaded,
    handleClearGPX,
    handleAnalyze
  }
}
