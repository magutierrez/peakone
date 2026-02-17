'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GPXUpload } from '@/components/gpx-upload';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import type { GPXData } from '@/lib/types';
import { calculateIBP, getIBPDifficulty, cn } from '@/lib/utils';

interface RouteConfigPanelProps {
  gpxData: GPXData | null;
  onGPXLoaded: (content: string, fileName: string) => void;
  gpxFileName: string | null;
  onClearGPX: () => void;
  onReverseRoute: () => void;
  activityType?: 'cycling' | 'walking';
}

const difficultyColors: Record<string, string> = {
  veryEasy: 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent',
  easy: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
  moderate: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent',
  hard: 'bg-orange-600 hover:bg-orange-700 text-white border-transparent',
  veryHard: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  extreme: 'bg-purple-900 hover:bg-purple-900 text-white border-transparent',
};

export function RouteConfigPanel({
  gpxData,
  onGPXLoaded,
  gpxFileName,
  onClearGPX,
  onReverseRoute,
  activityType = 'cycling',
}: RouteConfigPanelProps) {
  const t = useTranslations('RouteConfigPanel');
  const tibp = useTranslations('IBP');

  const ibpIndex = gpxData
    ? calculateIBP(gpxData.totalDistance, gpxData.totalElevationGain, activityType)
    : 0;
  const difficulty = getIBPDifficulty(ibpIndex, activityType);

  return (
    <div className="flex flex-col gap-5">
      {/* GPX Upload */}
      <div className="mb-2 flex items-center justify-between">
        <Label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('gpxFile')}
        </Label>
        {gpxData && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-[10px] text-muted-foreground hover:text-primary"
            onClick={onReverseRoute}
          >
            <span className="rotate-90">⇄</span> Invertir sentido
          </Button>
        )}
      </div>
      <div>
        <GPXUpload onFileLoaded={onGPXLoaded} fileName={gpxFileName} onClear={onClearGPX} />
      </div>

      {/* Route Stats */}
      {gpxData && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="font-mono text-lg font-bold text-foreground">
                {gpxData.totalDistance.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">{t('km')}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="font-mono text-lg font-bold text-primary">
                +{Math.round(gpxData.totalElevationGain)}
              </p>
              <p className="text-xs text-muted-foreground">{t('elevationGain')}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-center">
              <p className="font-mono text-lg font-bold text-destructive">
                -{Math.round(gpxData.totalElevationLoss)}
              </p>
              <p className="text-xs text-muted-foreground">{t('elevationLoss')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tibp('title')}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px] text-[11px] leading-relaxed">
                      {tibp('description')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="font-mono text-lg font-bold text-foreground">
                {ibpIndex}
              </span>
            </div>
            <Badge className={cn('px-3 py-1 text-[10px] uppercase tracking-wider', difficultyColors[difficulty])}>
              {tibp(`difficulty.${difficulty}`)}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
