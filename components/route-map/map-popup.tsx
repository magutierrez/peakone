'use client'

import { Popup } from 'react-map-gl/maplibre'
import { useTranslations } from 'next-intl'
import { WEATHER_CODES } from '@/lib/types'
import type { RouteWeatherPoint } from '@/lib/types'

interface MapPopupProps {
  popupInfo: RouteWeatherPoint & { index: number }
  onClose: () => void
}

export function MapPopup({ popupInfo, onClose }: MapPopupProps) {
  const t = useTranslations('RouteMap')
  const tTimeline = useTranslations('WeatherTimeline')
  const tw = useTranslations('WeatherCodes')

  const hasTranslation = !!tw.raw(popupInfo.weather.weatherCode.toString())
  const weatherDescription = hasTranslation 
    ? tw(popupInfo.weather.weatherCode.toString() as any) 
    : (WEATHER_CODES[popupInfo.weather.weatherCode]?.description || tTimeline('unknownWeather'))

  return (
    <Popup
      longitude={popupInfo.point.lon}
      latitude={popupInfo.point.lat}
      anchor="bottom"
      onClose={onClose}
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
          {weatherDescription}
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span>{popupInfo.weather.temperature}°C</span>
          <span className="text-muted-foreground">
            {t('tooltip.wind')}: {popupInfo.weather.windSpeed} km/h
          </span>
        </div>
      </div>
    </Popup>
  )
}
