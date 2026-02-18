'use client';

import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GPXData, RouteConfig } from '@/lib/types';
import { cn, calculateIBP, getIBPDifficulty, formatDistance, formatElevation } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

import { ActivityConfigSection } from './activity-config-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface SidebarProps {
  gpxData: GPXData | null;
  gpxFileName: string | null;
  error: string | null;
  onClearGPX: () => void;
  onReverseRoute: () => void;
  provider?: string;
  activityType: 'cycling' | 'walking'; // activityType is no longer optional here
  className?: string;
  recalculatedElevationGain: number;
  recalculatedElevationLoss: number;
  recalculatedTotalDistance: number;
  // Props for ActivityConfigSection
  config: RouteConfig;
  setConfig: React.Dispatch<React.SetStateAction<RouteConfig>>;
  onAnalyze: () => void;
  isLoading: boolean;
  hasGpxData: boolean;
}

export function Sidebar({
  gpxData,
  gpxFileName,
  error,
  onClearGPX,
  onReverseRoute,
  provider,
  activityType,
  className,
  recalculatedElevationGain,
  recalculatedElevationLoss,
  recalculatedTotalDistance,
  // ActivityConfigSection props
  config,
  setConfig,
  onAnalyze,
  isLoading,
  hasGpxData,
}: SidebarProps) {
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');
  const { unitSystem } = useSettings();

  const ibpIndex = gpxData
    ? calculateIBP(recalculatedTotalDistance, recalculatedElevationGain, activityType)
    : 0;
  const difficulty = getIBPDifficulty(ibpIndex, activityType);

  return (
    <aside className={cn(
      "sticky top-[57px] h-[calc(100vh-57px)] w-full shrink-0 border-b border-border bg-card lg:w-80 lg:border-b-0 lg:border-r",
      className
    )}>
      <div className="flex h-full flex-col overflow-hidden p-4">
        <div className="flex h-full min-h-0 flex-col gap-6">

          {/* Route Stats */}
          {gpxData && (
            <div className="flex flex-col gap-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('routeSummary')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-[10px] text-muted-foreground hover:text-primary"
                  onClick={onReverseRoute}
                >
                  <span className="rotate-90"><RotateCcw /></span> {t('reverseRoute')}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-secondary p-3 text-center">
                  <p className="font-mono text-lg font-bold text-foreground">
                    {formatDistance(recalculatedTotalDistance, unitSystem).split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDistance(recalculatedTotalDistance, unitSystem).split(' ')[1]}</p>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-center">
                  <p className="font-mono text-lg font-bold text-primary">
                    +{formatElevation(recalculatedElevationGain, unitSystem).split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatElevation(recalculatedElevationGain, unitSystem).split(' ')[1]}</p>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-center">
                  <p className="font-mono text-lg font-bold text-destructive">
                    -{formatElevation(recalculatedElevationLoss, unitSystem).split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatElevation(recalculatedElevationLoss, unitSystem).split(' ')[1]}</p>
                </div>
              </div>
              
              {/* IBP Index */}
              <div className="mt-2 flex flex-col gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tibp('title')}
                </Label>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-primary">{ibpIndex}</p>
                  <p className="text-sm font-medium text-muted-foreground">({tibp(`difficulty.${difficulty}`)})</p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Configuration */}
          <ActivityConfigSection
            config={config}
            setConfig={setConfig}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            hasGpxData={hasGpxData}
            totalDistance={recalculatedTotalDistance} // Use recalculated distance
            recalculatedElevationGain={recalculatedElevationGain}
            recalculatedElevationLoss={recalculatedElevationLoss}
          />
          
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
            {/* Removed Strava, Saved Routes, GPX upload */}
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
