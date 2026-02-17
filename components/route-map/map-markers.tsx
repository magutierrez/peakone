'use client';

import { Marker } from 'react-map-gl/maplibre';
import { WindArrow } from '@/components/wind-arrow';
import { MapPin } from 'lucide-react';
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface MapMarkersProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex: number | null;
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  onPointSelect?: (index: number) => void;
  onHoverPoint: (index: number | null) => void;
  activityType?: 'cycling' | 'walking';
}

export function MapMarkers({
  points,
  weatherPoints,
  selectedPointIndex,
  activeFilter,
  onPointSelect,
  onHoverPoint,
  activityType,
}: MapMarkersProps) {
  const t = useTranslations('WeatherTimeline');
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  // Unique escape points to avoid clutter
  const escapePoints = activityType === 'walking' 
    ? Array.from(new Set(weatherPoints?.map(wp => wp.escapePoint?.name).filter(Boolean)))
        .map(name => weatherPoints?.find(wp => wp.escapePoint?.name === name)?.escapePoint)
    : [];

  return (
    <>
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
