'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouteAnalysis } from '@/hooks/use-route-analysis';
import type { RouteConfig } from '@/lib/types';

import { Header } from './header';
import { EmptyState } from './empty-state';
import { Sidebar } from './sidebar';
import { Session } from 'next-auth';
import { useSavedRoutes } from '@/hooks/use-saved-routes';

import { RouteLoadingOverlay } from './route-loading-overlay';
import { ActivityConfigSection } from './activity-config-section';
import { AnalysisResults } from './analysis-results';
import { AnalysisSkeleton } from './analysis-skeleton';
import { cn } from '@/lib/utils';

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const th = useTranslations('HomePage');
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-card">
        <span className="text-sm text-muted-foreground">{th('loadingMap')}</span>
      </div>
    );
  },
});

function getDefaultDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

interface HomePageClientProps {
  session: Session | null;
}

export default function HomePageClient({ session }: HomePageClientProps) {
  const [config, setConfig] = useState<RouteConfig>({
    date: getDefaultDate(),
    time: '08:00',
    speed: 25,
    activityType: 'cycling',
  });

  const [activeFilter, setActiveFilter] = useState<{
    key: 'pathType' | 'surface';
    value: string;
  } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [showWaterSources, setShowWaterSources] = useState(false);
  const { saveRoute, routes } = useSavedRoutes();
  const lastSavedRef = useRef<string | null>(null);

  const {
    gpxData,
    gpxFileName,
    rawGPXContent,
    weatherPoints,
    elevationData,
    routeInfoData,
    selectedPointIndex,
    setSelectedPointIndex,
    isLoading,
    isRouteInfoLoading,
    error,
    handleGPXLoaded,
    handleStravaActivityLoaded,
    handleClearGPX,
    handleReverseRoute,
    handleAnalyze,
  } = useRouteAnalysis(config);

  const onClearGPXWithRange = () => {
    setSelectedRange(null);
    handleClearGPX();
  };

  const onReverseWithRange = () => {
    setSelectedRange(null);
    handleReverseRoute();
  };

  useEffect(() => {
    // Only save if it's a real GPX (XML content) and not a Strava JSON representation
    const isRealGPX = rawGPXContent?.trim().startsWith('<?xml') || rawGPXContent?.trim().startsWith('<gpx');

    if (gpxData && rawGPXContent && gpxFileName && session?.user && isRealGPX) {
      const routeExists = routes.some(
        (r) =>
          r.name === gpxFileName &&
          Number(r.distance).toFixed(2) === gpxData.totalDistance.toFixed(2),
      );

      if (!routeExists && lastSavedRef.current !== rawGPXContent) {
        saveRoute(gpxFileName, rawGPXContent, gpxData.totalDistance, gpxData.totalElevationGain);
        lastSavedRef.current = rawGPXContent;
      }
    }
  }, [gpxData, rawGPXContent, gpxFileName, session?.user, routes, saveRoute]);

  const sidebarContent = (
    <Sidebar
      gpxData={gpxData}
      onGPXLoaded={handleGPXLoaded}
      onStravaActivityLoaded={handleStravaActivityLoaded}
      gpxFileName={gpxFileName}
      onClearGPX={onClearGPXWithRange}
      onReverseRoute={onReverseWithRange}
      error={error}
      provider={session?.provider}
      activityType={config.activityType}
      className="border-none sticky-none h-full w-full"
    />
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} mobileMenuContent={sidebarContent} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Sidebar
          gpxData={gpxData}
          onGPXLoaded={handleGPXLoaded}
          onStravaActivityLoaded={handleStravaActivityLoaded}
          gpxFileName={gpxFileName}
          onClearGPX={onClearGPXWithRange}
          onReverseRoute={onReverseWithRange}
          error={error}
          provider={session?.provider}
          activityType={config.activityType}
          className="hidden lg:flex"
        />

        <main className="relative flex min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          <div className="flex w-full flex-col gap-10 p-4 md:p-8 lg:w-[60%] lg:overflow-y-auto lg:h-[calc(100vh-57px)] custom-scrollbar">
            {!gpxData ? (
              <div className="flex flex-col gap-8">
                {/* Mobile-first: show sidebar content here when empty */}
                <div className="lg:hidden">
                  {sidebarContent}
                </div>
                {/* Desktop: show empty state */}
                <div className="hidden lg:block">
                  <EmptyState />
                </div>
              </div>
            ) : isRouteInfoLoading ? (
              <AnalysisSkeleton />
            ) : (
              <>
                <AnalysisResults
                  weatherPoints={weatherPoints}
                  routeInfoData={routeInfoData}
                  elevationData={elevationData}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  selectedPointIndex={selectedPointIndex}
                  setSelectedPointIndex={setSelectedPointIndex}
                  onRangeSelect={setSelectedRange}
                  selectedRange={selectedRange}
                  activityType={config.activityType}
                  showWaterSources={showWaterSources}
                  onToggleWaterSources={() => setShowWaterSources(!showWaterSources)}
                />

                <ActivityConfigSection
                  config={config}
                  setConfig={setConfig}
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  hasGpxData={!!gpxData}
                  totalDistance={gpxData.totalDistance}
                />
              </>
            )}
          </div>

          <div className={cn(
            "h-[400px] lg:h-[calc(100vh-57px)] w-full border-t lg:border-t-0 lg:border-l border-border lg:w-[40%] relative",
            !gpxData && "hidden lg:block"
          )}>
            <RouteLoadingOverlay isVisible={isRouteInfoLoading} />
            <RouteMap
              points={gpxData?.points || []}
              weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
              selectedPointIndex={selectedPointIndex}
              onPointSelect={setSelectedPointIndex}
              activeFilter={activeFilter}
              selectedRange={selectedRange}
              activityType={config.activityType}
              onClearSelection={() => setSelectedRange(null)}
              showWaterSources={showWaterSources}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
