'use client';

import { useTranslations } from 'next-intl';
import { RouteSegments } from '@/components/weather-timeline/route-segments';
import { ElevationProfile } from '@/components/weather-timeline/elevation-profile';
import { WeatherSummary } from '@/components/weather-timeline/weather-summary';
import { WeatherList } from '@/components/weather-timeline/weather-list';
import { WeatherPointDetail } from '@/components/weather-timeline/weather-point-detail';
import type { RouteWeatherPoint } from '@/lib/types';

interface AnalysisResultsProps {
  weatherPoints: RouteWeatherPoint[];
  routeInfoData: any[];
  elevationData: { distance: number; elevation: number }[];
  activeFilter: { key: 'pathType' | 'surface'; value: string } | null;
  setActiveFilter: (filter: { key: 'pathType' | 'surface'; value: string } | null) => void;
  selectedPointIndex: number | null;
  setSelectedPointIndex: (index: number | null) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
}

export function AnalysisResults({
  weatherPoints,
  routeInfoData,
  elevationData,
  activeFilter,
  setActiveFilter,
  selectedPointIndex,
  setSelectedPointIndex,
  onRangeSelect,
}: AnalysisResultsProps) {
  const th = useTranslations('HomePage');

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-4 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
            {th('sections.terrain')}
          </h3>
        </div>
        <RouteSegments
          weatherPoints={
            weatherPoints.length > 0
              ? weatherPoints
              : routeInfoData.map((d) => ({ ...d, point: d }))
          }
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <div className="h-4 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
            {th('sections.altitude')}
          </h3>
        </div>
        <ElevationProfile
          weatherPoints={weatherPoints}
          elevationData={elevationData}
          selectedIndex={selectedPointIndex}
          onSelect={setSelectedPointIndex}
          onRangeSelect={onRangeSelect}
        />
      </section>

      {weatherPoints.length > 0 && (
        <section className="flex flex-col gap-8">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <div className="h-4 w-1 rounded-full bg-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
              {th('sections.weatherAnalysis')}
            </h3>
          </div>
          <WeatherSummary weatherPoints={weatherPoints} />
          <WeatherList
            weatherPoints={weatherPoints}
            selectedIndex={selectedPointIndex}
            onSelect={setSelectedPointIndex}
          />
          {selectedPointIndex !== null && weatherPoints[selectedPointIndex] && (
            <WeatherPointDetail point={weatherPoints[selectedPointIndex]} />
          )}
        </section>
      )}
    </>
  );
}
