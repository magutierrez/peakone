'use client';

import { RouteConfigPanel } from '@/components/route-config-panel';
import { SavedRoutesList } from '@/components/saved-routes-list';
import { StravaActivitiesList } from '@/components/strava-activities-list';
import { StravaConnector } from './strava-connector';
import type { GPXData } from '@/lib/types';

interface SidebarProps {
  gpxData: GPXData | null;
  gpxFileName: string | null;
  error: string | null;
  onGPXLoaded: (content: string, fileName: string) => void;
  onStravaActivityLoaded: (data: GPXData, fileName: string) => void;
  onClearGPX: () => void;
  onReverseRoute: () => void;
  provider?: string;
}

export function Sidebar({
  gpxData,
  gpxFileName,
  error,
  onGPXLoaded,
  onStravaActivityLoaded,
  onClearGPX,
  onReverseRoute,
  provider,
}: SidebarProps) {
  return (
    <aside className="sticky top-[57px] h-[calc(100vh-57px)] w-full shrink-0 border-b border-border bg-card lg:w-80 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col overflow-hidden p-4">
        <div className="flex h-full min-h-0 flex-col gap-6">
          <RouteConfigPanel
            gpxData={gpxData}
            onGPXLoaded={onGPXLoaded}
            gpxFileName={gpxFileName}
            onClearGPX={onClearGPX}
            onReverseRoute={onReverseRoute}
          />

          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
            {provider !== 'strava' && <StravaConnector />}

            {provider === 'strava' && (
              <div className="flex min-h-[300px] flex-col">
                <StravaActivitiesList onLoadGPX={onStravaActivityLoaded} />
              </div>
            )}

            <div className="flex flex-col border-t border-border pb-4 pt-6">
              <SavedRoutesList onLoadRoute={onGPXLoaded} />
            </div>
          </div>

          {error && (
            <div className="mt-auto shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>
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
    </aside>
  );
}
