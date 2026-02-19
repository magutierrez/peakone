'use client';

import { Marker } from 'react-map-gl/maplibre';
import { WindArrow } from '@/components/wind-arrow';
import { MapPin, Droplets } from 'lucide-react';
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface MapMarkersProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex: number | null;
  fullSelectedPointIndex?: number | null; // New prop for precise tracking
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  onPointSelect?: (index: number) => void;
  onHoverPoint: (index: number | null) => void;
  activityType?: 'cycling' | 'walking';
  showWaterSources?: boolean;
}

export function MapMarkers({
  points,
  weatherPoints,
  selectedPointIndex,
  fullSelectedPointIndex = null,
  activeFilter,
  onPointSelect,
  onHoverPoint,
  activityType,
  showWaterSources,
}: MapMarkersProps) {
  const t = useTranslations('WeatherTimeline');
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  const currentTrackPoint = fullSelectedPointIndex !== null ? points[fullSelectedPointIndex] : null;

  // Unique escape points to avoid clutter
  const escapePoints = activityType === 'walking' 
    ? Array.from(new Set(weatherPoints?.map(wp => wp.escapePoint?.name).filter(Boolean)))
        .map(name => weatherPoints?.find(wp => wp.escapePoint?.name === name)?.escapePoint)
    : [];

  // Unique water sources
  const waterSources = (showWaterSources && weatherPoints)
    ? Array.from(new Map(
        weatherPoints.flatMap(wp => wp.waterSources || []).map(ws => [`${ws.lat},${ws.lon}`, ws])
      ).values())
    : [];

  return (
    <>
      {/* Water Sources */}
      {waterSources.map((ws, i) => (
        <Marker key={`water-${i}`} longitude={ws.lon} latitude={ws.lat} anchor="bottom">
          <div className="group flex flex-col items-center">
            <div className="invisible group-hover:visible absolute -top-8 rounded-lg border border-border bg-card px-2 py-1 text-[9px] font-bold shadow-sm whitespace-nowrap z-50">
              {ws.name} ({t(`reliability.${ws.reliability}` as any)})
            </div>
            <div className={`p-1 rounded-full border-2 border-white shadow-md ${
              ws.reliability === 'high' ? 'bg-emerald-500' : (ws.reliability === 'medium' ? 'bg-amber-500' : 'bg-red-500')
            }`}>
              <Droplets className="h-3 w-3 text-white fill-white/20" />
            </div>
          </div>
        </Marker>
      ))}

      {/* Escape Points */}
      {escapePoints.map((ep, i) => ep && (
        <Marker key={`escape-${i}`} longitude={ep.lon} latitude={ep.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-border bg-card px-2 py-1 text-[9px] font-bold shadow-sm whitespace-nowrap">
              {ep.name}
            </div>
            <MapPin className="h-5 w-5 text-indigo-500 fill-indigo-500/20" />
          </div>
        </Marker>
      ))}

      {startPoint && (
        <Marker
          longitude={startPoint.lon}
          latitude={startPoint.lat}
          anchor="bottom"
          offset={[0, -5]}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-green-600 font-bold text-white shadow-lg transition-transform hover:scale-110">
            A
          </div>
        </Marker>
      )}
      {endPoint && endPoint !== startPoint && (
        <Marker longitude={endPoint.lon} latitude={endPoint.lat} anchor="bottom" offset={[0, -5]}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-600 font-bold text-white shadow-lg transition-transform hover:scale-110">
            B
          </div>
        </Marker>
      )}

      {/* Dynamic Cursor Point (Komoot style) */}
      {currentTrackPoint && (
        <Marker 
          longitude={currentTrackPoint.lon} 
          latitude={currentTrackPoint.lat} 
          anchor="center"
          z-index={100}
        >
          <div className="h-4 w-4 bg-white border-2 border-blue-500 rounded-full shadow-md animate-in fade-in zoom-in duration-150" />
        </Marker>
      )}

      {weatherPoints?.map((wp, idx) => {
        const isSelected = selectedPointIndex === idx;
        const isFiltered =
          activeFilter && (wp[activeFilter.key] || 'unknown') !== activeFilter.value;

        if (isFiltered && !isSelected) return null;

        return (
          <Marker
            key={idx}
            longitude={wp.point.lon}
            latitude={wp.point.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onPointSelect?.(idx);
            }}
          >
            <button
              className={`group relative flex items-center justify-center transition-all hover:scale-125 ${isSelected ? 'z-10 scale-125' : 'z-0'}`}
              onMouseEnter={() => onHoverPoint(idx)}
              onMouseLeave={() => onHoverPoint(null)}
            >
              <WindArrow
                direction={wp.weather.windDirection}
                travelBearing={wp.bearing}
                effect={wp.windEffect}
                size={isSelected ? 36 : 28}
              />
              {isSelected && (
                <div className="absolute inset-0 animate-pulse rounded-full border-2 border-white/50" />
              )}
            </button>
          </Marker>
        );
      })}
    </>
  );
}
