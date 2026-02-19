'use client';

import { Calendar as CalendarIcon, Clock, Gauge } from 'lucide-react';
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <Label
            htmlFor="speed"
            className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
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
            />
            <div className="shrink-0">
              <p className="text-muted-foreground text-[10px] uppercase">
                {t('estimatedDuration')}
              </p>
              <p className="text-foreground font-mono text-sm font-bold whitespace-nowrap">
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
            className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {t('date')}
          </Label>
          <Input
            id="date"
            type="date"
            value={config.date}
            onChange={(e) => setConfig({ ...config, date: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label
            htmlFor="time"
            className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
          >
            <Clock className="h-3.5 w-3.5" />
            {t('startTime')}
          </Label>
          <Input
            id="time"
            type="time"
            value={config.time}
            onChange={(e) => setConfig({ ...config, time: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Button
          onClick={onAnalyze}
          disabled={!hasGpxData || isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full font-semibold shadow-lg"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="border-primary-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
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
