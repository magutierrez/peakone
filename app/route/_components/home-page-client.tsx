'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Info, RotateCcw } from 'lucide-react';
import { useRouteAnalysis, type UseRouteAnalysisConfig } from '@/hooks/use-route-analysis';
import type { RouteConfig } from '@/lib/types';
import { getRouteFromDb } from '@/lib/db';
import { cn, calculateIBP, getIBPDifficulty, formatDistance, formatElevation } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

import { Header } from '../../_components/header';
import { EmptyState } from '../../_components/empty-state';
import { ActivityConfigSection } from '../../_components/activity-config-section';
import { Session } from 'next-auth';

import { RouteLoadingOverlay } from '../../_components/route-loading-overlay';
import { AnalysisResults } from '../../_components/analysis-results';
import { AnalysisSkeleton } from '../../_components/analysis-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisChart } from '@/components/weather-timeline/elevation-profile';
import { RouteSegments } from '@/components/weather-timeline/route-segments';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RouteMap = dynamic(() => import('@/components/route-map'), {
  ssr: false,
  loading: function Loading() {
    const th = useTranslations('HomePage');
    return (
      <div className="bg-card flex h-full items-center justify-center rounded-lg">
        <span className="text-muted-foreground text-sm">{th('loadingMap')}</span>
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

export default function HomePageClient({ session: serverSession }: HomePageClientProps) {
  const { data: clientSession } = useSession();
  const session = clientSession || serverSession;
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  const initialActivityType = (searchParams.get('activity') as 'cycling' | 'walking') || 'cycling';

  const [fetchedRawGpxContent, setFetchedRawGpxContent] = useState<string | null>(null);
  const [fetchedGpxFileName, setFetchedGpxFileName] = useState<string | null>(null);
  const [fetchedActivityType, setFetchedActivityType] = useState<'cycling' | 'walking'>(
    initialActivityType,
  );
  const [initialDistance, setInitialDistance] = useState<number>(0);
  const [initialElevationGain, setInitialElevationGain] = useState<number>(0);
  const [initialElevationLoss, setInitialElevationLoss] = useState<number>(0);

  useEffect(() => {
    const userIdentifier = session?.user?.email || session?.user?.id;
    if (routeId && userIdentifier && !fetchedRawGpxContent) {
      const fetchRoute = async () => {
        const route = await getRouteFromDb(routeId, userIdentifier);
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
  }, [
    routeId,
    session?.user?.email,
    session?.user?.id,
    fetchedRawGpxContent,
    router,
    initialActivityType,
  ]);

  const [config, setConfig] = useState<RouteConfig>({
    date: getDefaultDate(),
    time: '08:00',
    speed: 25,
  });

  const activityType = fetchedActivityType;

  const [activeFilter, setActiveFilter] = useState<{
    key: 'pathType' | 'surface' | 'hazard';
    value: string;
  } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [exactSelectedPoint, setExactSelectedPoint] = useState<any | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lon: number; name?: string } | null>(
    null,
  );
  const [showWaterSources, setShowWaterSources] = useState(false);
  const tHomePage = useTranslations('HomePage');
  const twt = useTranslations('WeatherTimeline');
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');
  const { unitSystem } = useSettings();

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
    bestWindows,
    isFindingWindow,
    handleFindBestWindow,
  } = useRouteAnalysis({ ...config, activityType }, fetchedRawGpxContent, fetchedGpxFileName, {
    distance: initialDistance,
    elevationGain: initialElevationGain,
    elevationLoss: initialElevationLoss,
  });

  const onClearGPXWithRange = useCallback(() => {
    setSelectedRange(null);
    handleClearGPX();
    router.push('/setup');
  }, [handleClearGPX, router]);

  const onReverseWithRange = useCallback(() => {
    setSelectedRange(null);
    handleReverseRoute();
  }, [handleReverseRoute]);

  const handleSelectBestWindow = useCallback(
    (isoTime: string) => {
      const date = new Date(isoTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      setConfig({
        ...config,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
      });
    },
    [config],
  );

  const handleSelectAndAnalyze = useCallback(
    (isoTime: string) => {
      const date = new Date(isoTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      const newConfig: UseRouteAnalysisConfig = {
        ...config,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        activityType,
      };

      setConfig(newConfig);
      handleAnalyze(newConfig);
    },
    [config, handleAnalyze, activityType],
  );

  // IBP calculation for route summary
  const ibpIndex = gpxData
    ? calculateIBP(recalculatedTotalDistance, recalculatedElevationGain, activityType)
    : 0;
  const difficulty = getIBPDifficulty(ibpIndex, activityType);

  const getDifficultyBadgeVariant = (
    difficultyLevel: 'veryEasy' | 'easy' | 'moderate' | 'hard' | 'veryHard' | 'extreme',
  ) => {
    switch (difficultyLevel) {
      case 'veryEasy':
      case 'easy':
        return 'outline';
      case 'moderate':
        return 'secondary';
      case 'hard':
        return 'destructive';
      case 'veryHard':
      case 'extreme':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header session={session} />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative flex min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          <div className="custom-scrollbar flex w-full flex-col gap-10 p-4 md:p-8 lg:h-[calc(100vh-57px)] lg:w-[60%] lg:overflow-y-auto">
            {isLoading && !gpxData ? (
              <AnalysisSkeleton />
            ) : !gpxData ? (
              <EmptyState />
            ) : isRouteInfoLoading ? (
              <AnalysisSkeleton />
            ) : (
              <div className="flex flex-col gap-10">
                {/* Activity Config Section — arriba */}
                <ActivityConfigSection
                  config={config}
                  setConfig={setConfig}
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                  hasGpxData={!!gpxData}
                  totalDistance={recalculatedTotalDistance}
                  recalculatedElevationGain={recalculatedElevationGain}
                  recalculatedElevationLoss={recalculatedElevationLoss}
                />

                {/* Elevation Profile + Terrain Tabs */}
                <Tabs defaultValue="elevation" className="w-full">
                  <TabsList className="custom-scrollbar bg-secondary/50 mb-4 flex w-full items-center justify-start overflow-x-auto overflow-y-hidden md:grid md:grid-cols-2 md:justify-center">
                    <TabsTrigger value="elevation" className="min-w-fit md:w-full">
                      {twt('elevationTitle')}
                    </TabsTrigger>
                    <TabsTrigger value="terrain" className="min-w-fit md:w-full">
                      {twt('segmentsTitle')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="elevation" className="mt-0">
                    <AnalysisChart
                      elevationData={elevationData}
                      weatherPoints={weatherPoints}
                      allPoints={gpxData?.points || []}
                      selectedPoint={exactSelectedPoint}
                      onSelect={setExactSelectedPoint}
                      onRangeSelect={setSelectedRange}
                      selectedRange={selectedRange}
                      activeFilter={activeFilter}
                    />
                  </TabsContent>
                  <TabsContent value="terrain" className="mt-0">
                    <RouteSegments
                      weatherPoints={weatherPoints}
                      activeFilter={activeFilter}
                      setActiveFilter={setActiveFilter}
                      onRangeSelect={setSelectedRange}
                    />
                  </TabsContent>
                </Tabs>

                {/* Route Summary — debajo del perfil de elevación */}
                <div className="border-border bg-card rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                      {t('routeSummary')}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-primary h-7 gap-1.5 px-2 text-[10px]"
                      onClick={onReverseWithRange}
                    >
                      <span className="rotate-90">
                        <RotateCcw />
                      </span>{' '}
                      {t('reverseRoute')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-foreground font-mono text-lg font-bold">
                        {formatDistance(recalculatedTotalDistance, unitSystem).split(' ')[0]}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistance(recalculatedTotalDistance, unitSystem).split(' ')[1]}
                      </p>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-primary font-mono text-lg font-bold">
                        +{formatElevation(recalculatedElevationGain, unitSystem).split(' ')[0]}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatElevation(recalculatedElevationGain, unitSystem).split(' ')[1]}
                      </p>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <p className="text-destructive font-mono text-lg font-bold">
                        -{formatElevation(recalculatedElevationLoss, unitSystem).split(' ')[0]}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatElevation(recalculatedElevationLoss, unitSystem).split(' ')[1]}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        {tibp('title')}
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4">
                              <Info className="text-muted-foreground h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {tibp('description')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-primary text-2xl font-bold">{ibpIndex}</p>
                      <Badge
                        variant={getDifficultyBadgeVariant(difficulty)}
                        className="text-sm font-medium"
                      >
                        {tibp(`difficulty.${difficulty}`)}
                      </Badge>
                    </div>
                  </div>

                  {error && (
                    <div className="border-destructive/30 bg-destructive/10 mt-4 rounded-lg border p-3">
                      <p className="text-destructive text-xs">{error}</p>
                    </div>
                  )}
                </div>

                {isWeatherAnalyzed ? (
                  <AnalysisResults
                    weatherPoints={weatherPoints}
                    routeInfoData={routeInfoData}
                    allPoints={gpxData?.points || []}
                    elevationData={elevationData}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    selectedPointIndex={selectedPointIndex}
                    setSelectedPointIndex={setSelectedPointIndex}
                    onRangeSelect={setSelectedRange}
                    onSelectPoint={setExactSelectedPoint}
                    selectedRange={selectedRange}
                    activityType={activityType}
                    showWaterSources={showWaterSources}
                    onToggleWaterSources={() => setShowWaterSources(!showWaterSources)}
                    bestWindows={bestWindows}
                    isFindingWindow={isFindingWindow}
                    onFindBestWindow={handleFindBestWindow}
                    onSelectBestWindow={handleSelectBestWindow}
                    onAnalyzeBestWindow={handleSelectAndAnalyze}
                    onShowOnMap={(lat, lon, name) => setFocusPoint({ lat, lon, name })}
                  />
                ) : (
                  <div className="border-border bg-card/50 text-muted-foreground flex h-60 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                    <h2 className="mb-2 text-xl font-semibold">{tHomePage('analyzeFirst')}</h2>
                    <p className="max-w-md text-sm">{tHomePage('clickAnalyze')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={cn(
              'border-border relative h-[400px] w-full border-t lg:h-[calc(100vh-57px)] lg:w-[40%] lg:border-t-0 lg:border-l',
              !gpxData && 'hidden lg:block',
            )}
          >
            <RouteLoadingOverlay isVisible={isRouteInfoLoading} />
            <RouteMap
              points={gpxData?.points || []}
              weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
              selectedPointIndex={selectedPointIndex}
              exactSelectedPoint={exactSelectedPoint}
              onPointSelect={setSelectedPointIndex}
              activeFilter={activeFilter}
              selectedRange={selectedRange}
              activityType={activityType}
              onClearSelection={() => {
                setSelectedRange(null);
                setActiveFilter(null);
              }}
              showWaterSources={showWaterSources}
              onResetToFullRouteView={(func) => (mapResetViewRef.current = func)}
              focusPoint={focusPoint}
            />
          </div>
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}
