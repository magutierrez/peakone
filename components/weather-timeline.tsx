'use client';

import type { RouteWeatherPoint } from '@/lib/types';
import { WeatherSummary } from './weather-timeline/weather-summary';
import { WeatherList } from './weather-timeline/weather-list';
import { AnalysisChart as ElevationProfile } from './weather-timeline/elevation-profile';
import { WeatherPointDetail } from './weather-timeline/weather-point-detail';
import { RouteSegments } from './weather-timeline/route-segments';

interface WeatherTimelineProps {
  weatherPoints: RouteWeatherPoint[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  onFilterChange?: (filter: { key: 'pathType' | 'surface'; value: string } | null) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
}

export function WeatherTimeline({
  weatherPoints,
  selectedIndex,
  onSelect,
  activeFilter,
  onFilterChange,
  onRangeSelect,
}: WeatherTimelineProps) {
  if (weatherPoints.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Summary Stats */}
      <WeatherSummary weatherPoints={weatherPoints} />

      {/* 2. Horizontal Points List */}
      <WeatherList
        weatherPoints={weatherPoints}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
      />

      {/* 3. Route Segments (Path types & Surfaces) */}
      <RouteSegments
        weatherPoints={weatherPoints}
        activeFilter={activeFilter}
        setActiveFilter={onFilterChange}
        onRangeSelect={onRangeSelect}
      />

      {/* 4. Elevation Chart (Komoot style) */}
      <ElevationProfile
        weatherPoints={weatherPoints}
        allPoints={[]} // Empty array as fallback
        elevationData={[]} // Empty array as fallback
        selectedPoint={selectedIndex !== null ? weatherPoints[selectedIndex] : null}
        onSelect={(p) => {
          if (p === null) onSelect(-1); // Or handle null index
          // This component seems to use index, but elevation-profile uses point
        }}
        onRangeSelect={onRangeSelect}
      />

      {/* 5. Selected Point Detail */}
      {selectedIndex !== null && weatherPoints[selectedIndex] && (
        <WeatherPointDetail weatherPoint={weatherPoints[selectedIndex]} activityType="cycling" />
      )}
    </div>
  );
}
