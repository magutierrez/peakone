'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Mountain, Wind } from 'lucide-react'
import { RouteConfigPanel } from '@/components/route-config-panel'
import { WeatherTimeline } from '@/components/weather-timeline'
import { parseGPX, sampleRoutePoints, calculateBearing, getWindEffect } from '@/lib/gpx-parser'
import type { GPXData, RouteConfig, RouteWeatherPoint, WeatherData } from '@/lib/types'

const RouteMap = dynamic(() => import('@/components/route-map').then((m) => ({ default: m.RouteMap })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card">
      <span className="text-sm text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
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
        setError('El archivo GPX no contiene suficientes puntos.')
        return
      }
      setGPXData(data)
      setGPXFileName(fileName)
      setWeatherPoints([])
      setSelectedPointIndex(null)
      setError(null)
    } catch {
      setError('Error al leer el archivo GPX. Verifica el formato.')
    }
  }, [])

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
            // Wait for 2^i * 1000ms
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
      throw lastError || new Error('Error al obtener datos tras varios intentos')
    }

    try {
      const sampled = sampleRoutePoints(gpxData.points, 24)

      const startTime = new Date(`${config.date}T${config.time}:00`)
      const pointsWithTime = sampled.map((point) => {
        const hoursElapsed = point.distanceFromStart / config.speed
        const estimatedTime = new Date(startTime.getTime() + hoursElapsed * 3600000)
        return {
          ...point,
          estimatedTime,
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
        if (response.status === 429) {
          throw new Error('Demasiadas peticiones. Por favor, espera un momento antes de volver a intentarlo.')
        }
        throw new Error('Error al obtener datos meteorologicos')
      }

      const data = await response.json()
      const weatherData: WeatherData[] = data.weather

      const routeWeatherPoints: RouteWeatherPoint[] = pointsWithTime.map((point, idx) => {
        const nextPoint = pointsWithTime[Math.min(idx + 1, pointsWithTime.length - 1)]
        const bearing = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon)
        const weather = weatherData[idx]
        const windResult = getWindEffect(bearing, weather.windDirection)

        return {
          point: {
            ...point,
            estimatedTime: point.estimatedTime,
          },
          weather,
          windEffect: windResult.effect,
          windEffectAngle: windResult.angle,
          bearing,
        }
      })

      setWeatherPoints(routeWeatherPoints)
      setSelectedPointIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [gpxData, config])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Mountain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">RouteWeather</h1>
              <p className="text-xs text-muted-foreground">Forecast para rutas outdoor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Open-Meteo API
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-border bg-card p-4 lg:w-80 lg:border-b-0 lg:border-r lg:overflow-y-auto lg:h-[calc(100vh-57px)]">
          <RouteConfigPanel
            config={config}
            onConfigChange={setConfig}
            gpxData={gpxData}
            onGPXLoaded={handleGPXLoaded}
            gpxFileName={gpxFileName}
            onClearGPX={handleClearGPX}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </aside>

        {/* Map & Results */}
        <main className="flex flex-1 flex-col">
          {/* Map */}
          <div className="h-[40vh] lg:h-[50vh]">
            <RouteMap
              points={gpxData?.points || []}
              weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
              selectedPointIndex={selectedPointIndex}
              onPointSelect={setSelectedPointIndex}
            />
          </div>

          {/* Weather Timeline */}
          <div className="flex-1 overflow-y-auto border-t border-border bg-background p-4">
            {weatherPoints.length > 0 ? (
              <WeatherTimeline
                weatherPoints={weatherPoints}
                selectedIndex={selectedPointIndex}
                onSelect={setSelectedPointIndex}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Mountain className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sube un archivo GPX para empezar
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
                    Configura la fecha, hora y velocidad, y analiza tu ruta para ver el forecast
                    meteorologico punto a punto con el analisis de vientos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
