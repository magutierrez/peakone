'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRouteAnalysis } from '@/hooks/use-route-analysis';
import type { RouteConfig } from '@/lib/types';
import { getRouteFromDb } from '@/lib/db';

import { Header } from '../../_components/header';
import { EmptyState } from '../../_components/empty-state';
import { Sidebar } from '../../_components/sidebar';
import { Session } from 'next-auth';

import { RouteLoadingOverlay } from '../../_components/route-loading-overlay';
import { AnalysisResults } from '../../_components/analysis-results';
import { AnalysisSkeleton } from '../../_components/analysis-skeleton';
import { AnalysisChart } from '@/components/weather-timeline/elevation-profile';
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  const initialActivityType = (searchParams.get('activity') as 'cycling' | 'walking') || 'cycling';

  const [fetchedRawGpxContent, setFetchedRawGpxContent] = useState<string | null>(null);
  const [fetchedGpxFileName, setFetchedGpxFileName] = useState<string | null>(null);
  const [fetchedActivityType, setFetchedActivityType] = useState<'cycling' | 'walking'>(initialActivityType);
  const [initialDistance, setInitialDistance] = useState<number>(0);
  const [initialElevationGain, setInitialElevationGain] = useState<number>(0);
  const [initialElevationLoss, setInitialElevationLoss] = useState<number>(0);

  useEffect(() => {
    if (routeId && session?.user?.email && !fetchedRawGpxContent) {
      const fetchRoute = async () => {
        const route = await getRouteFromDb(routeId, session.user!.email!);
        if (route) {
          setFetchedRawGpxContent(route.gpx_content);
          setFetchedGpxFileName(route.name);
          setFetchedActivityType(route.activity_type);
          setInitialDistance(route.distance);
          setInitialElevationGain(route.elevation_gain);
          setInitialElevationLoss(route.elevation_loss);
        } else {
          router.replace('/setup');
        }
      };
      fetchRoute();
    } else if (!routeId && !fetchedRawGpxContent) {
      router.replace('/setup');
    }
  }, [routeId, session?.user?.email, fetchedRawGpxContent, router, initialActivityType]);

  const [config, setConfig] = useState<RouteConfig>({
    date: getDefaultDate(),
    time: '08:00',
    speed: 25,
  });

  const activityType = fetchedActivityType;

  const [activeFilter, setActiveFilter] = useState<{
    key: 'pathType' | 'surface';
    value: string;
  } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [showWaterSources, setShowWaterSources] = useState(false);
  const tHomePage = useTranslations('HomePage');

  const mapResetViewRef = useRef<(() => void) | null>(null);
  const handleResetMapView = useCallback(() => {
    if (mapResetViewRef.current) {
      mapResetViewRef.current();
    }
  }, []);

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
    handleClearGPX,
    handleReverseRoute,
    handleAnalyze,
    recalculatedElevationGain,
    recalculatedElevationLoss,
    recalculatedTotalDistance,
    isWeatherAnalyzed,
  } = useRouteAnalysis(
    { ...config, activityType },
    fetchedRawGpxContent,
    fetchedGpxFileName,
    {
      distance: initialDistance,
      elevationGain: initialElevationGain,
      elevationLoss: initialElevationLoss,
    }
  );

  const onClearGPXWithRange = useCallback(() => {
    setSelectedRange(null);
    handleClearGPX();
    router.push('/setup');
  }, [handleClearGPX, router]);

  const onReverseWithRange = useCallback(() => {
    setSelectedRange(null);
    handleReverseRoute();
  }, [handleReverseRoute]);

  const sidebarContent = (
    <Sidebar
      gpxData={gpxData}
      gpxFileName={gpxFileName}
      onClearGPX={onClearGPXWithRange}
      onReverseRoute={onReverseWithRange}
      error={error}
      provider={session?.provider}
      activityType={activityType}
      className="border-none sticky-none h-full w-full"
      recalculatedElevationGain={recalculatedElevationGain}
      recalculatedElevationLoss={recalculatedElevationLoss}
      recalculatedTotalDistance={recalculatedTotalDistance}
      config={config}
      setConfig={setConfig}
      onAnalyze={handleAnalyze}
      isLoading={isLoading}
      hasGpxData={!!gpxData}
    />
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} mobileMenuContent={sidebarContent} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Sidebar
          gpxData={gpxData}
          gpxFileName={gpxFileName}
          onClearGPX={onClearGPXWithRange}
          onReverseRoute={onReverseWithRange}
          error={error}
          provider={session?.provider}
          activityType={activityType}
          className="hidden lg:flex"
          recalculatedElevationGain={recalculatedElevationGain}
          recalculatedElevationLoss={recalculatedElevationLoss}
          recalculatedTotalDistance={recalculatedTotalDistance}
          config={config}
          setConfig={setConfig}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          hasGpxData={!!gpxData}
        />

        <main className="relative flex min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          <div className="flex w-full flex-col gap-10 p-4 md:p-8 lg:w-[60%] lg:overflow-y-auto lg:h-[calc(100vh-57px)] custom-scrollbar">
            {isLoading && !gpxData ? (
              <AnalysisSkeleton />
            ) : !gpxData ? (
              <div className="flex flex-col gap-8">
                <div className="lg:hidden">
                  {sidebarContent}
                </div>
                <div className="hidden lg:block">
                  <EmptyState />
                </div>
              </div>
            ) : isRouteInfoLoading ? (
              <AnalysisSkeleton />
            ) : (
              <>
                <AnalysisChart
                  elevationData={elevationData}
                  weatherPoints={weatherPoints}
                  selectedIndex={selectedPointIndex}
                  onSelect={setSelectedPointIndex}
                  onRangeSelect={setSelectedRange}
                  selectedRange={selectedRange}
                  activeFilter={activeFilter}
                />
                {isWeatherAnalyzed ? (
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
                    activityType={activityType}
                    showWaterSources={showWaterSources}
                    onToggleWaterSources={() => setShowWaterSources(!showWaterSources)}
                  />
                ) : (
                  <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-muted-foreground">
                    <h2 className="mb-2 text-xl font-semibold">{tHomePage('analyzeFirst')}</h2>
                    <p className="max-w-md text-sm">{tHomePage('clickAnalyze')}</p>
                  </div>
                )}
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
              activityType={activityType}
              onClearSelection={() => setSelectedRange(null)}
              showWaterSources={showWaterSources}
              onResetToFullRouteView={(func) => (mapResetViewRef.current = func)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
