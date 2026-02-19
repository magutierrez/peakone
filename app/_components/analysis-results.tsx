'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ThermometerSnowflake, Waves } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherSummary } from '@/components/weather-timeline/weather-summary';
import { WeatherList } from '@/components/weather-timeline/weather-list';
import { RouteAdvice } from '@/components/route-advice';
import { WeatherPointDetail } from '@/components/weather-timeline/weather-point-detail';
import { RouteHazards } from '@/components/route-hazards';
import { BestDepartureFinder } from '@/components/best-departure-finder';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { analyzeRouteSegments, calculatePhysiologicalNeeds } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';
import type { RouteWeatherPoint } from '@/lib/types';

interface AnalysisResultsProps {
  weatherPoints: RouteWeatherPoint[];
  routeInfoData: any[];
  elevationData: { distance: number; elevation: number }[];
  activeFilter: { key: 'pathType' | 'surface'; value: string } | null;
  setActiveFilter: (filter: { key: 'pathType' | 'surface'; value: string } | null) => void;
  selectedPointIndex: number | null;
  setSelectedPointIndex: (index: number | null) => void;
  onRangeSelect: (range: { start: number; end: number } | null) => void;
  selectedRange: { start: number; end: number } | null;
  activityType: 'cycling' | 'walking';
  showWaterSources: boolean;
  onToggleWaterSources: () => void;
  bestWindows?: any[];
  isFindingWindow?: boolean;
  onFindBestWindow?: () => void;
  onSelectBestWindow?: (time: string) => void;
  onAnalyzeBestWindow?: (time: string) => void;
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
  selectedRange,
  activityType,
  showWaterSources,
  onToggleWaterSources,
  bestWindows = [],
  isFindingWindow = false,
  onFindBestWindow = () => {},
  onSelectBestWindow = () => {},
  onAnalyzeBestWindow = () => {},
}: AnalysisResultsProps) {
  const t = useTranslations('HomePage');
  const tp = useTranslations('physiology');
  const th = useTranslations('Hazards');
  const { unitSystem } = useSettings();

  const [tab, setTab] = useState('weather');

  const routeDurationHours =
    weatherPoints.length > 0 &&
    weatherPoints[0].point.estimatedTime &&
    weatherPoints[weatherPoints.length - 1].point.estimatedTime
      ? (weatherPoints[weatherPoints.length - 1].point.estimatedTime!.getTime() -
          weatherPoints[0].point.estimatedTime!.getTime()) /
        (1000 * 60 * 60)
      : 0;

  const totalElevationGain =
    elevationData.length > 0
      ? elevationData[elevationData.length - 1].elevation - elevationData[0].elevation
      : 0;

  const totalDistanceKm =
    elevationData.length > 0 ? elevationData[elevationData.length - 1].distance : 0;

  const avgTemperatureCelsius =
    weatherPoints.reduce((sum, wp) => sum + wp.weather.temperature, 0) / weatherPoints.length;

  const { calories, waterLiters } = calculatePhysiologicalNeeds(
    routeDurationHours,
    totalDistanceKm,
    totalElevationGain,
    avgTemperatureCelsius,
    activityType,
  );

  const routeSegments = analyzeRouteSegments(weatherPoints);
  const totalSegments = routeSegments.length;
  const highDangerSegments = routeSegments.filter((s) => s.dangerLevel === 'high').length;
  const mediumDangerSegments = routeSegments.filter((s) => s.dangerLevel === 'medium').length;
  const lowDangerSegments = routeSegments.filter((s) => s.dangerLevel === 'low').length;

  useEffect(() => {
    const resultsContainer = document.getElementById('analysis-results-container');
    if (resultsContainer) {
      resultsContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tab]);

  return (
    <div id="analysis-results-container">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/50 p- mb-8 grid w-full grid-cols-3">
          <TabsTrigger value="weather">{t('sections.weatherAnalysis')}</TabsTrigger>
          <TabsTrigger value="advice">{t('sections.advice')}</TabsTrigger>
          <TabsTrigger value="hazards">{t('sections.hazards')}</TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="mt-6 flex flex-col gap-6">
          <WeatherSummary weatherPoints={weatherPoints} />
          <WeatherList
            weatherPoints={weatherPoints}
            selectedIndex={selectedPointIndex}
            onSelect={setSelectedPointIndex}
          />
          {selectedPointIndex !== null &&
            (() => {
              const selectedWeatherPoint = weatherPoints[selectedPointIndex];
              if (selectedWeatherPoint) {
                return (
                  <WeatherPointDetail
                    weatherPoint={selectedWeatherPoint}
                    activityType={activityType}
                  />
                );
              }
              return null;
            })()}
          <BestDepartureFinder
            windows={bestWindows}
            isLoading={isFindingWindow}
            onFind={onFindBestWindow}
            onSelect={onSelectBestWindow}
            onAnalyze={onAnalyzeBestWindow}
          />{' '}
        </TabsContent>

        <TabsContent value="advice" className="mt-6 flex flex-col gap-6">
          <RouteAdvice
            weatherPoints={weatherPoints}
            activityType={activityType}
            showWaterSources={showWaterSources}
            onToggleWaterSources={onToggleWaterSources}
          />
        </TabsContent>

        <TabsContent value="hazards" className="mt-6 flex flex-col gap-6">
          <RouteHazards
            weatherPoints={weatherPoints}
            onSelectSegment={(segment) =>
              segment && onRangeSelect({ start: segment?.start, end: segment?.end })
            }
            onClearSelection={() => onRangeSelect(null)}
          />

          {totalSegments > 0 && (
            <div className="border-border bg-card/50 flex flex-col gap-4 rounded-xl border p-6">
              <div className="border-border flex items-center gap-2 border-b pb-2">
                <div className="bg-primary h-4 w-1 rounded-full" />
                <h3 className="text-foreground/80 text-sm font-bold tracking-wider uppercase">
                  {th('effortLevel')}
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-foreground flex items-center justify-between text-sm">
                  <p>{th('levels.high')}</p>
                  <p>{highDangerSegments}</p>
                </div>
                <Progress
                  value={(highDangerSegments / totalSegments) * 100}
                  className="h-2 bg-red-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-foreground flex items-center justify-between text-sm">
                  <p>{th('levels.medium')}</p>
                  <p>{mediumDangerSegments}</p>
                </div>
                <Progress
                  value={(mediumDangerSegments / totalSegments) * 100}
                  className="h-2 bg-orange-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-foreground flex items-center justify-between text-sm">
                  <p>{th('levels.low')}</p>
                  <p>{lowDangerSegments}</p>
                </div>
                <Progress
                  value={(lowDangerSegments / totalSegments) * 100}
                  className="h-2 bg-amber-500"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
