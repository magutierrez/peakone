'use client'

import { Wind, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { WeatherIcon } from '@/components/weather-icon'
import { WEATHER_CODES } from '@/lib/types'
import type { RouteWeatherPoint } from '@/lib/types'

interface WeatherListProps {
  weatherPoints: RouteWeatherPoint[]
  selectedIndex: number | null
  onSelect: (index: number) => void
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

export function WeatherList({ weatherPoints, selectedIndex, onSelect }: WeatherListProps) {
  const t = useTranslations('WeatherTimeline')
  const tw = useTranslations('WeatherCodes')

  return (
    <div className="w-full overflow-hidden">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{t('timelineTitle')}</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-2 pb-4">
          {weatherPoints.map((wp, idx) => {
            const time = new Date(wp.weather.time)
            const locale = 'es-ES'
            const timeStr = time.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            })
            const hasTranslation = !!tw.raw(wp.weather.weatherCode.toString())
            const weatherDescription = hasTranslation
              ? tw(wp.weather.weatherCode.toString() as any)
              : WEATHER_CODES[wp.weather.weatherCode]?.description || t('unknownWeather')
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
                <span className="font-mono text-xs font-bold text-foreground">{timeStr}</span>
                <span className="text-[10px] text-muted-foreground">
                  km {wp.point.distanceFromStart.toFixed(1)}
                </span>
                <WeatherIcon code={wp.weather.weatherCode} className="h-6 w-6" />
                <span className="text-[10px] text-muted-foreground">{weatherDescription}</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {wp.weather.temperature}°
                </span>
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {wp.weather.windSpeed}
                  </span>
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
                    {t(`windEffect.${wp.windEffect}` as any)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
