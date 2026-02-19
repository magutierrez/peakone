'use client';

import { Info, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GPXData, RouteConfig } from '@/lib/types';
import { cn, calculateIBP, getIBPDifficulty, formatDistance, formatElevation } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

import { ActivityConfigSection } from './activity-config-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  gpxData: GPXData | null;
  gpxFileName: string | null;
  error: string | null;
  onClearGPX: () => void;
  onReverseRoute: () => void;
  provider?: string;
  activityType: 'cycling' | 'walking';
  className?: string;
  recalculatedElevationGain: number;
  recalculatedElevationLoss: number;
  recalculatedTotalDistance: number;
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
    <aside
      className={cn(
        'border-border bg-card sticky top-[57px] h-[calc(100vh-57px)] shrink-0 border-b lg:border-r lg:border-b-0',
        className,
      )}
    >
      <div className="flex h-full flex-col overflow-hidden p-4">
        <div className="flex h-full min-h-0 flex-col gap-6">
          <ActivityConfigSection
            config={config}
            setConfig={setConfig}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            hasGpxData={hasGpxData}
            totalDistance={recalculatedTotalDistance}
            recalculatedElevationGain={recalculatedElevationGain}
            recalculatedElevationLoss={recalculatedElevationLoss}
          />

          {gpxData && (
            <div className="flex flex-col gap-3">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-muted-foreground block text-xs font-semibold tracking-wider uppercase">
                  {t('routeSummary')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary h-7 gap-1.5 px-2 text-[10px]"
                  onClick={onReverseRoute}
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

              <div className="mt-2 flex flex-col gap-1.5">
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
            </div>
          )}

          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1"></div>

          {error && (
            <div className="border-destructive/30 bg-destructive/10 mt-auto shrink-0 rounded-lg border p-3">
              <p className="text-destructive text-xs">{error}</p>
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
