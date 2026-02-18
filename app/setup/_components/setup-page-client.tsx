'use client';

import { useState } from 'react';
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
import { Bike, Footprints, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { LocaleSwitcher } from '@/app/_components/locale-switcher';
import { saveRouteToDb } from '@/lib/db'; // Import saveRouteToDb

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

  const { routes: savedRoutes } = useSavedRoutes(); // to show saved routes

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
      const routeId = await saveRouteToDb(
        session.user.email,
        selectedGpxFileName || 'Unnamed Route',
        rawGpxContent,
        activityType,
        selectedGpxData.totalDistance,
        selectedGpxData.totalElevationGain,
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>

      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">{t('title')}</h1>

        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-semibold text-muted-foreground">{t('selectRouteSource')}</Label>
            <GPXUpload onFileLoaded={handleGPXLoaded} fileName={selectedGpxFileName} onClear={handleClearGPX} />
          </div>

          <div className="flex flex-col gap-3">
            <StravaConnector />
            {session?.provider === 'strava' && (
              <StravaActivitiesList onLoadGPX={handleStravaActivityLoaded} />
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-semibold text-muted-foreground">{t('savedRoutes')}</Label>
            <SavedRoutesList onLoadRoute={handleGPXLoaded} />
          </div>

          {selectedGpxData && (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {tRouteConfig('activity')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setActivityType('cycling')}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                        activityType === 'cycling'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      <Bike className="h-4 w-4" />
                      {tRouteConfig('cycling')}
                    </button>
                    <button
                      onClick={() => setActivityType('walking')}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                        activityType === 'walking'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      <Footprints className="h-4 w-4" />
                      {tRouteConfig('walking')}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
            <div className="mt-auto shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 p-3 mb-6">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

        <Button onClick={handleAnalyzeRoute} disabled={!selectedGpxData} className="w-full text-lg h-12 gap-2">
          {t('analyzeRoute')} <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
