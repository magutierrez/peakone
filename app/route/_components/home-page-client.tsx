'use client';

import { useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouteAnalysis } from '@/hooks/use-route-analysis';
import { useRouteStore } from '@/store/route-store';
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

  const tHomePage = useTranslations('HomePage');
  const twt = useTranslations('WeatherTimeline');
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');
  const { unitSystem } = useSettings();

  // Store state
  const gpxData = useRouteStore((s) => s.gpxData);
  const isLoading = useRouteStore((s) => s.isLoading);
  const isRouteInfoLoading = useRouteStore((s) => s.isRouteInfoLoading);
  const error = useRouteStore((s) => s.error);
  const recalculatedTotalDistance = useRouteStore((s) => s.recalculatedTotalDistance);
  const recalculatedElevationGain = useRouteStore((s) => s.recalculatedElevationGain);
  const recalculatedElevationLoss = useRouteStore((s) => s.recalculatedElevationLoss);
  const isWeatherAnalyzed = useRouteStore((s) => s.isWeatherAnalyzed);
  const config = useRouteStore((s) => s.config);
  const fetchedActivityType = useRouteStore((s) => s.fetchedActivityType);
  const { setFetchedRoute, setConfig, reset } = useRouteStore();

  const { handleAnalyze, handleClearGPX, handleReverseRoute, handleFindBestWindow } =
    useRouteAnalysis();

  const mapResetViewRef = useRef<(() => void) | null>(null);

  const activityType = fetchedActivityType || initialActivityType;

  // Reset store on unmount to avoid stale state on re-navigation
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Fetch route data from DB
  useEffect(() => {
    const userIdentifier = session?.user?.email || session?.user?.id;
    if (routeId && userIdentifier) {
      const fetchRoute = async () => {
        const route = await getRouteFromDb(routeId, userIdentifier);
        if (route) {
          setFetchedRoute({
            rawGpxContent: route.gpx_content,
            gpxFileName: route.name,
            activityType: route.activity_type,
            distance: route.distance,
            elevationGain: route.elevation_gain,
            elevationLoss: route.elevation_loss,
          });
        } else {
          router.replace('/setup');
        }
      };
      fetchRoute();
    } else if (!routeId) {
      router.replace('/setup');
    }
  }, [routeId, session?.user?.email, session?.user?.id, setFetchedRoute, router]);

  const onReverseWithRange = useCallback(() => {
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
      setConfig({ ...config, date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` });
    },
    [config, setConfig],
  );

  const handleSelectAndAnalyze = useCallback(
    (isoTime: string) => {
      const date = new Date(isoTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const newConfig = {
        ...config,
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        activityType,
      };
      setConfig(newConfig);
      handleAnalyze(newConfig);
    },
    [config, setConfig, handleAnalyze, activityType],
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
          <div className="custom-scrollbar flex w-full flex-col gap-10 p-4 md:p-8 lg:h-[calc(100vh-57px)] lg:w-[55%] lg:overflow-y-auto">
            {isLoading && !gpxData ? (
              <AnalysisSkeleton />
            ) : !gpxData ? (
              <EmptyState />
            ) : isRouteInfoLoading ? (
              <AnalysisSkeleton />
            ) : (
              <div className="flex flex-col gap-10">
                <ActivityConfigSection
                  onAnalyze={handleAnalyze}
                  onReverseRoute={onReverseWithRange}
                />

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
                    <AnalysisChart />
                  </TabsContent>
                  <TabsContent value="terrain" className="mt-0">
                    <RouteSegments />
                  </TabsContent>
                </Tabs>

                <div className="border-border bg-card rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                      {t('routeSummary')}
                    </Label>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
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
                    <div className="bg-secondary group relative flex flex-col items-center justify-center rounded-lg p-3 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <p className="text-primary font-mono text-lg font-bold">{ibpIndex}</p>
                              <Badge
                                variant={getDifficultyBadgeVariant(difficulty)}
                                className="h-4 px-1 text-[8px] font-bold uppercase"
                              >
                                {tibp(`difficulty.${difficulty}`)}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            <p className="font-bold">{tibp('title')}</p>
                            <p>{tibp('description')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                    onFindBestWindow={handleFindBestWindow}
                    onSelectBestWindow={handleSelectBestWindow}
                    onAnalyzeBestWindow={handleSelectAndAnalyze}
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
              'border-border relative h-[400px] w-full border-t lg:h-[calc(100vh-57px)] lg:w-[45%] lg:border-t-0 lg:border-l',
              !gpxData && 'hidden lg:block',
            )}
          >
            <RouteLoadingOverlay isVisible={isRouteInfoLoading} />
            <RouteMap
              onResetToFullRouteView={(func) => (mapResetViewRef.current = func)}
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
