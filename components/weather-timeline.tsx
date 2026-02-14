'use client'

import { Wind, Thermometer, Droplets, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { WeatherIcon } from '@/components/weather-icon'
import { WindArrow } from '@/components/wind-arrow'
import { WEATHER_CODES } from '@/lib/types'
import type { RouteWeatherPoint } from '@/lib/types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface WeatherTimelineProps {
  weatherPoints: RouteWeatherPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

function getWindEffectLabel(effect: string): string {
  switch (effect) {
    case 'tailwind':
      return 'A favor'
    case 'headwind':
      return 'En contra'
    case 'crosswind-left':
      return 'Lateral izq.'
    case 'crosswind-right':
      return 'Lateral der.'
    default:
      return ''
  }
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="h-3.5 w-3.5 text-primary" />
    case 'headwind':
      return <ArrowUp className="h-3.5 w-3.5 text-destructive" />
    case 'crosswind-left':
      return <ArrowLeft className="h-3.5 w-3.5 text-accent" />
    case 'crosswind-right':
      return <ArrowRight className="h-3.5 w-3.5 text-accent" />
    default:
      return null
  }
}

export function WeatherTimeline({ weatherPoints, selectedIndex, onSelect }: WeatherTimelineProps) {
  if (weatherPoints.length === 0) return null

  // Summary stats
  const avgTemp = weatherPoints.reduce((s, w) => s + w.weather.temperature, 0) / weatherPoints.length
  const maxWind = Math.max(...weatherPoints.map((w) => w.weather.windSpeed))
  const maxGusts = Math.max(...weatherPoints.map((w) => w.weather.windGusts))
  const avgPrecipProb = weatherPoints.reduce((s, w) => s + w.weather.precipitationProbability, 0) / weatherPoints.length
  const tailwindPercent = (weatherPoints.filter((w) => w.windEffect === 'tailwind').length / weatherPoints.length) * 100
  const headwindPercent = (weatherPoints.filter((w) => w.windEffect === 'headwind').length / weatherPoints.length) * 100

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            <span className="text-xs">Temp. media</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">{avgTemp.toFixed(1)}°C</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wind className="h-4 w-4" />
            <span className="text-xs">Viento max.</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">
            {maxWind.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">km/h</span>
          </p>
          <p className="text-xs text-muted-foreground">Rachas: {maxGusts.toFixed(0)} km/h</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span className="text-xs">Prob. lluvia</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">{avgPrecipProb.toFixed(0)}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wind className="h-4 w-4" />
            <span className="text-xs">Viento</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-medium text-primary">{tailwindPercent.toFixed(0)}% favor</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-medium text-destructive">{headwindPercent.toFixed(0)}% contra</span>
          </div>
        </div>
      </div>

      {/* Timeline horizontal scroll */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Timeline por punto</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-3">
            {weatherPoints.map((wp, idx) => {
              const time = new Date(wp.weather.time)
              const timeStr = time.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })
              const weatherInfo = WEATHER_CODES[wp.weather.weatherCode] || { description: 'Desconocido' }
              const isSelected = selectedIndex === idx

              return (
                <button
                  key={idx}
                  onClick={() => onSelect(idx)}
                  className={`flex shrink-0 flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                  style={{ minWidth: '100px' }}
                >
                  <span className="text-xs font-bold font-mono text-foreground">{timeStr}</span>
                  <span className="text-[10px] text-muted-foreground">km {wp.point.distanceFromStart.toFixed(1)}</span>
                  <WeatherIcon code={wp.weather.weatherCode} className="h-6 w-6" />
                  <span className="text-[10px] text-muted-foreground">{weatherInfo.description}</span>
                  <span className="text-sm font-bold font-mono text-foreground">{wp.weather.temperature}°</span>
                  <div className="flex items-center gap-1">
                    <Wind className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground">{wp.weather.windSpeed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getWindEffectIcon(wp.windEffect)}
                    <span
                      className={`text-[10px] font-medium ${
                        wp.windEffect === 'tailwind'
                          ? 'text-primary'
                          : wp.windEffect === 'headwind'
                            ? 'text-destructive'
                            : 'text-accent'
                      }`}
                    >
                      {getWindEffectLabel(wp.windEffect)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Selected point detail */}
      {selectedIndex !== null && weatherPoints[selectedIndex] && (
        <WeatherDetail point={weatherPoints[selectedIndex]} />
      )}
    </div>
  )
}

function WeatherDetail({ point }: { point: RouteWeatherPoint }) {
  const time = new Date(point.weather.time)
  const timeStr = time.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateStr = time.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const weatherInfo = WEATHER_CODES[point.weather.weatherCode] || { description: 'Desconocido' }

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
          <p className="text-2xl font-bold font-mono text-foreground">{timeStr}</p>
          <p className="text-xs text-muted-foreground">km {point.point.distanceFromStart.toFixed(1)}</p>
          {point.point.ele !== undefined && (
            <p className="text-xs text-muted-foreground">Alt: {Math.round(point.point.ele)}m</p>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <WeatherIcon code={point.weather.weatherCode} className="h-10 w-10" />
          <span className="text-xs text-muted-foreground text-center">{weatherInfo.description}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Temperature */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <Thermometer className="h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Temperatura</p>
            <p className="text-sm font-bold font-mono text-foreground">{point.weather.temperature}°C</p>
            <p className="text-[10px] text-muted-foreground">Sens. {point.weather.apparentTemperature}°C</p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <WindArrow
            direction={point.weather.windDirection}
            travelBearing={point.bearing}
            effect={point.windEffect}
            size={36}
          />
          <div>
            <p className="text-xs text-muted-foreground">Viento</p>
            <p className="text-sm font-bold font-mono text-foreground">{point.weather.windSpeed} km/h</p>
            <p className="text-[10px] text-muted-foreground">Rachas: {point.weather.windGusts} km/h</p>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <Droplets className="h-4 w-4 shrink-0 text-chart-2" />
          <div>
            <p className="text-xs text-muted-foreground">Lluvia</p>
            <p className="text-sm font-bold font-mono text-foreground">{point.weather.precipitation}mm</p>
            <p className="text-[10px] text-muted-foreground">Prob: {point.weather.precipitationProbability}%</p>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Visibilidad</p>
            <p className="text-sm font-bold font-mono text-foreground">
              {(point.weather.visibility / 1000).toFixed(1)} km
            </p>
            <p className="text-[10px] text-muted-foreground">Nubes: {point.weather.cloudCover}%</p>
          </div>
        </div>
      </div>

      {/* Wind effect summary */}
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3">
        {getWindEffectIcon(point.windEffect)}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Viento {getWindEffectLabel(point.windEffect).toLowerCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {'Angulo relativo: '}
            {point.windEffectAngle.toFixed(0)}° respecto a tu direccion de viaje
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rumbo viaje</p>
          <p className="text-sm font-mono font-bold text-foreground">{point.bearing.toFixed(0)}°</p>
        </div>
      </div>
    </div>
  )
}
