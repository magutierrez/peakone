'use client';

import { Marker } from 'react-map-gl/maplibre';
import { WindArrow } from '@/components/wind-arrow';
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';

interface MapMarkersProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex: number | null;
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  onPointSelect?: (index: number) => void;
  onHoverPoint: (index: number | null) => void;
}

export function MapMarkers({
  points,
  weatherPoints,
  selectedPointIndex,
  activeFilter,
  onPointSelect,
  onHoverPoint,
}: MapMarkersProps) {
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  return (
    <>
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
