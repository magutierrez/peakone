'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import type { GPXData } from '@/lib/types';
import { parseGPX } from '@/lib/gpx-parser';
import { cn } from '@/lib/utils';

// UI Components from main app
import { GPXUpload } from '@/components/gpx-upload';
import { StravaConnector } from '../../_components/strava-connector';
import { StravaActivitiesList } from '@/components/strava-activities-list';
import { SavedRoutesList } from '@/components/saved-routes-list';
import { Button } from '@/components/ui/button';
import { Bike, Footprints, ArrowRight, FileUp, History, Activity } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { LocaleSwitcher } from '@/app/_components/locale-switcher';
import { UserMenu } from '@/app/_components/user-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SetupPageClientProps {
  session: Session | null;
}

export function SetupPageClient({ session }: SetupPageClientProps) {
  const t = useTranslations('SetupPage');
  const tRouteConfig = useTranslations('RouteConfigPanel');
  const router = useRouter();

  const [selectedGpxData, setSelectedGpxData] = useState<GPXData | null>(null);
  const [selectedGpxFileName, setSelectedGpxFileName] = useState<string | null>(null);
  const [rawGpxContent, setRawGpxContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activityType, setActivityType] = useState<'cycling' | 'walking'>('cycling');

  const { routes: savedRoutes, saveRoute, refresh } = useSavedRoutes(); // to show saved routes

  // Refresh routes list whenever this component is mounted (e.g. navigation from /route)
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handlers for GPX, Strava, Saved Routes
  const handleGPXLoaded = (content: string, fileName: string) => {
    try {
      const data = parseGPX(content);
      if (data.points.length < 2) {
        setError(t('errors.insufficientPoints'));
        return;
      }
      setSelectedGpxData(data);
      setSelectedGpxFileName(fileName);
      setRawGpxContent(content);
      setError(null);
    } catch {
      setError(t('errors.readError'));
    }
  };

  const handleStravaActivityLoaded = (data: GPXData, fileName: string) => {
    setSelectedGpxData(data);
    setSelectedGpxFileName(fileName);
    setRawGpxContent(JSON.stringify(data)); // Store JSON for Strava, main app will handle
    setError(null);
  };

  const handleClearGPX = () => {
    setSelectedGpxData(null);
    setSelectedGpxFileName(null);
    setRawGpxContent(null);
    setError(null);
  };

  const handleAnalyzeRoute = async () => {
    if (!selectedGpxData || !rawGpxContent || !session?.user?.email) {
      setError(t('errors.noRouteSelected')); // Adjust error message if needed
      return;
    }

    try {
      const distance = selectedGpxData.totalDistance || 0;
      if (distance <= 0) {
        setError(t('errors.readError')); // Or a more specific error
        return;
      }

      const routeId = await saveRoute(
        selectedGpxFileName || 'Unnamed Route',
        rawGpxContent,
        activityType,
        distance,
        selectedGpxData.totalElevationGain || 0,
        selectedGpxData.totalElevationLoss || 0,
      );

      if (routeId) {
        const params = new URLSearchParams();
        params.set('routeId', routeId);
        params.set('name', selectedGpxFileName || 'Unnamed Route');
        params.set('activity', activityType);
        router.push(`/route?${params.toString()}`);
      } else {
        setError(t('errors.saveError')); // Add a translation key for this
      }
    } catch (err) {
      console.error('Error saving route:', err);
      setError(t('errors.unknownError'));
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LocaleSwitcher />
        <UserMenu
          userName={session?.user?.name}
          userEmail={session?.user?.email}
          userImage={session?.user?.image}
        />
      </div>

      <div className="border-border bg-card w-full max-w-2xl rounded-xl border p-6 shadow-xl">
        <h1 className="text-foreground mb-6 text-center text-2xl font-bold">{t('title')}</h1>

        <Tabs defaultValue="gpx" className="mb-8 w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="gpx" className="gap-2">
              <FileUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('uploadGPX')}</span>
              <span className="sm:hidden">GPX</span>
            </TabsTrigger>
            <TabsTrigger value="strava" className="gap-2">
              <Activity className="h-4 w-4" />
              <span>{t('strava')}</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{t('savedRoutes')}</span>
              <span className="sm:hidden">{t('savedRoutes').split(' ')[0]}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gpx" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-sm font-semibold">
                {t('selectRouteSource')}
              </Label>
              <GPXUpload
                onFileLoaded={handleGPXLoaded}
                fileName={selectedGpxFileName}
                onClear={handleClearGPX}
              />
            </div>
          </TabsContent>

          <TabsContent value="strava" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <StravaConnector />
              {session?.provider === 'strava' && (
                <StravaActivitiesList onLoadGPX={handleStravaActivityLoaded} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-sm font-semibold">
                {t('savedRoutes')}
              </Label>
              <SavedRoutesList onLoadRoute={handleGPXLoaded} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mb-8">
          {selectedGpxData && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-3">
                <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {tRouteConfig('activity')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActivityType('cycling')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                      activityType === 'cycling'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Bike className="h-4 w-4" />
                    {tRouteConfig('cycling')}
                  </button>
                  <button
                    onClick={() => setActivityType('walking')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all',
                      activityType === 'walking'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    <Footprints className="h-4 w-4" />
                    {tRouteConfig('walking')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-destructive/30 bg-destructive/10 mt-auto mb-6 shrink-0 rounded-lg border p-3">
            <p className="text-destructive text-xs">{error}</p>
          </div>
        )}

        <Button
          onClick={handleAnalyzeRoute}
          disabled={!selectedGpxData}
          className="h-12 w-full gap-2 text-lg"
        >
          {t('analyzeRoute')} <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
