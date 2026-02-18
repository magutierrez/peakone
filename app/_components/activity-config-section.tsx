'use client';

import { Bike, Footprints, Calendar as CalendarIcon, Clock, Gauge } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RouteConfig } from '@/lib/types';

interface ActivityConfigSectionProps {
  config: RouteConfig;
  setConfig: (config: RouteConfig) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  hasGpxData: boolean;
  totalDistance: number;
  recalculatedElevationGain: number;
  recalculatedElevationLoss: number;
}

export function ActivityConfigSection({
  config,
  setConfig,
  onAnalyze,
  isLoading,
  hasGpxData,
  totalDistance,
  recalculatedElevationGain,
  recalculatedElevationLoss,
}: ActivityConfigSectionProps) {
  const t = useTranslations('RouteConfigPanel');
  const th = useTranslations('HomePage');

  const estimatedDuration = (totalDistance / config.speed) * 60;
  const hours = Math.floor(estimatedDuration / 60);
  const minutes = Math.round(estimatedDuration % 60);

  return (
    <section className="flex flex-col gap-6 ">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <div className="h-4 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
          {th('sections.activityConfig')}
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <Label
            htmlFor="speed"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Gauge className="h-3.5 w-3.5" />
            {t('averageSpeed')}
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="speed"
              type="number"
              min={1}
              max={60}
              value={config.speed}
              onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) || 1 })}
              className="border-border bg-secondary font-mono"
            />
            <div className="shrink-0 ">
              <p className="text-[10px] uppercase text-muted-foreground">
                {t('estimatedDuration')}
              </p>
              <p className="whitespace-nowrap font-mono text-sm font-bold text-foreground">
                {t('durationFormat', {
                  hours,
                  minutes: minutes.toString().padStart(2, '0'),
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label
            htmlFor="date"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {t('date')}
          </Label>
          <Input
            id="date"
            type="date"
            value={config.date}
            onChange={(e) => setConfig({ ...config, date: e.target.value })}
            className="border-border bg-secondary"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label
            htmlFor="time"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Clock className="h-3.5 w-3.5" />
            {t('startTime')}
          </Label>
          <Input
            id="time"
            type="time"
            value={config.time}
            onChange={(e) => setConfig({ ...config, time: e.target.value })}
            className="border-border bg-secondary"
          />
        </div>
      </div>

      <div>
        <Button
          onClick={onAnalyze}
          disabled={!hasGpxData || isLoading}
          className="w-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              {t('analyzing')}
            </span>
          ) : (
            t('analyze')
          )}
        </Button>
      </div>
    </section>
  );
}
