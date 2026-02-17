'use client';

import { useTranslations } from 'next-intl';
import { RouteSegments } from '@/components/weather-timeline/route-segments';
import { ElevationProfile } from '@/components/weather-timeline/elevation-profile';
import { WeatherSummary } from '@/components/weather-timeline/weather-summary';
import { WeatherList } from '@/components/weather-timeline/weather-list';
import { WeatherPointDetail } from '@/components/weather-timeline/weather-point-detail';
import { RouteAdvice } from '@/components/route-advice';
import { RouteHazards } from '@/components/route-hazards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RouteWeatherPoint } from '@/lib/types';
import { CloudSun, ShieldAlert, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisResultsProps {
  weatherPoints: RouteWeatherPoint[];
  routeInfoData: any[];
  elevationData: { distance: number; elevation: number }[];
  activeFilter: { key: 'pathType' | 'surface'; value: string } | null;
  setActiveFilter: (filter: { key: 'pathType' | 'surface'; value: string } | null) => void;
  selectedPointIndex: number | null;
  setSelectedPointIndex: (index: number | null) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
  selectedRange?: { start: number; end: number } | null;
  activityType: 'cycling' | 'walking';
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
}: AnalysisResultsProps) {
  const th = useTranslations('HomePage');
  const tr = useTranslations('RouteMap');

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
        <Tabs defaultValue="weather" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-secondary/50 p-1">
            <TabsTrigger value="weather" className="gap-2">
              <CloudSun className="h-4 w-4" />
              {th('sections.weatherAnalysis')}
            </TabsTrigger>
            <TabsTrigger value="advice" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              {th('sections.advice')}
            </TabsTrigger>
            <TabsTrigger value="hazards" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {th('sections.hazards')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weather" className="space-y-8 animate-in fade-in-50 duration-500 outline-none">
            <WeatherSummary weatherPoints={weatherPoints} />
            <WeatherList
              weatherPoints={weatherPoints}
              selectedIndex={selectedPointIndex}
              onSelect={setSelectedPointIndex}
            />
            {selectedPointIndex !== null && weatherPoints[selectedPointIndex] && (
              <WeatherPointDetail point={weatherPoints[selectedPointIndex]} />
            )}
          </TabsContent>

          <TabsContent value="advice" className="animate-in slide-in-from-right-2 fade-in-50 duration-500 outline-none">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-1">{th('sections.advice')}</h3>
              <p className="text-sm text-muted-foreground">
                {activityType === 'cycling' 
                  ? th('sections.adviceCycling') 
                  : th('sections.adviceHiking')}
              </p>
            </div>
            <RouteAdvice weatherPoints={weatherPoints} activityType={activityType} />
          </TabsContent>

          <TabsContent value="hazards" className="animate-in slide-in-from-right-2 fade-in-50 duration-500 outline-none">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{th('sections.hazards')}</h3>
                <p className="text-sm text-muted-foreground">{th('sections.hazardsDesc')}</p>
              </div>
              {selectedRange && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onRangeSelect?.(null)}
                  className="h-8 gap-2 bg-secondary/50 border-primary/20 hover:bg-secondary"
                >
                  <RefreshCcw className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{tr('resetView')}</span>
                </Button>
              )}
            </div>
            <RouteHazards 
              weatherPoints={weatherPoints} 
              onSelectSegment={onRangeSelect}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
