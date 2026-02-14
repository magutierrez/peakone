'use client'

import { useEffect, useRef, useState } from 'react'
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types'
import { WEATHER_CODES } from '@/lib/types'

interface RouteMapProps {
  points: RoutePoint[]
  weatherPoints?: RouteWeatherPoint[]
  selectedPointIndex?: number | null
  onPointSelect?: (index: number) => void
}

function getWindEffectColor(effect: string): string {
  switch (effect) {
    case 'tailwind':
      return '#22c55e'
    case 'headwind':
      return '#ef4444'
    case 'crosswind-left':
    case 'crosswind-right':
      return '#f59e0b'
    default:
      return '#6b7280'
  }
}

export function RouteMap({ points, weatherPoints, selectedPointIndex, onPointSelect }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.CircleMarker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: true,
      }).setView([40.4168, -3.7038], 6)

      L.control.zoom({ position: 'topright' }).addTo(map)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      setIsReady(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Draw route
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current || points.length === 0) return

    const drawRoute = async () => {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current!

      // Clear existing
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current)
      }
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []

      // Draw polyline
      const latLngs = points.map((p) => [p.lat, p.lon] as [number, number])
      polylineRef.current = L.polyline(latLngs, {
        color: '#3ecf8e',
        weight: 3,
        opacity: 0.8,
      }).addTo(map)

      // Fit bounds
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [40, 40] })

      // Add weather markers if available
      if (weatherPoints && weatherPoints.length > 0) {
        weatherPoints.forEach((wp, idx) => {
          const color = getWindEffectColor(wp.windEffect)
          const marker = L.circleMarker([wp.point.lat, wp.point.lon], {
            radius: selectedPointIndex === idx ? 10 : 6,
            fillColor: color,
            color: selectedPointIndex === idx ? '#ffffff' : color,
            weight: selectedPointIndex === idx ? 3 : 1.5,
            fillOpacity: 0.9,
          })
            .addTo(map)
            .on('click', () => {
              onPointSelect?.(idx)
            })

          const weatherInfo = WEATHER_CODES[wp.weather.weatherCode] || {
            description: 'Desconocido',
          }
          const time = new Date(wp.weather.time)
          const timeStr = time.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })

          marker.bindTooltip(
            `<div style="font-family: system-ui; font-size: 12px; line-height: 1.4;">
              <strong>${timeStr}</strong> - km ${wp.point.distanceFromStart.toFixed(1)}<br/>
              ${weatherInfo.description}<br/>
              ${wp.weather.temperature}°C | Viento: ${wp.weather.windSpeed} km/h
            </div>`,
            { className: 'weather-tooltip' }
          )

          markersRef.current.push(marker)
        })
      } else {
        // Start/end markers only
        const startMarker = L.circleMarker([points[0].lat, points[0].lon], {
          radius: 8,
          fillColor: '#3ecf8e',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map)
        startMarker.bindTooltip('Inicio', { permanent: false })
        markersRef.current.push(startMarker)

        const endMarker = L.circleMarker(
          [points[points.length - 1].lat, points[points.length - 1].lon],
          {
            radius: 8,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1,
          }
        ).addTo(map)
        endMarker.bindTooltip('Final', { permanent: false })
        markersRef.current.push(endMarker)
      }
    }

    drawRoute()
  }, [isReady, points, weatherPoints, selectedPointIndex, onPointSelect])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <div ref={mapRef} className="h-full w-full" />
      <style jsx global>{`
        .weather-tooltip {
          background: hsl(220, 18%, 10%) !important;
          border: 1px solid hsl(220, 14%, 18%) !important;
          color: hsl(210, 20%, 92%) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        .weather-tooltip::before {
          border-top-color: hsl(220, 14%, 18%) !important;
        }
        .leaflet-control-zoom a {
          background: hsl(220, 18%, 10%) !important;
          color: hsl(210, 20%, 92%) !important;
          border-color: hsl(220, 14%, 18%) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(220, 16%, 16%) !important;
        }
        .leaflet-control-attribution {
          background: hsl(220, 18%, 10%, 0.8) !important;
          color: hsl(215, 12%, 55%) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: hsl(158, 64%, 52%) !important;
        }
      `}</style>

      {/* Legend */}
      {weatherPoints && weatherPoints.length > 0 && (
        <div className="absolute bottom-8 left-3 z-[1000] rounded-lg border border-border bg-card/95 p-3 backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold text-foreground">Efecto viento</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-xs text-muted-foreground">A favor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-xs text-muted-foreground">En contra</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-xs text-muted-foreground">Lateral</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
