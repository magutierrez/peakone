'use client';

import { Wind, Thermometer, Droplets, Sun, Clock, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { formatTemperature, formatWindSpeed } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/hooks/use-settings';
import { useWeatherSummary } from '@/hooks/use-weather-summary';

interface WeatherSummaryProps {
  weatherPoints: RouteWeatherPoint[];
}

export function WeatherSummary({ weatherPoints }: WeatherSummaryProps) {
  const t = useTranslations('WeatherTimeline');
  const { unitSystem, windUnit } = useSettings();

  const {
    avgTemp,
    maxWind,
    maxGusts,
    avgPrecipProb,
    tailwindPct,
    headwindPct,
    intensePoints,
    shadePoints,
    total,
    arrivesAtNight,
    lastTime,
  } = useWeatherSummary(weatherPoints);

  if (weatherPoints.length === 0) return null;

  const getPercent = (count: number) => ((count / total) * 100).toFixed(0);

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          <span className="text-xs">{t('summary.avgTemp')}</span>
        </div>
        <p className="text-foreground mt-1 font-mono text-xl font-bold">
          {formatTemperature(avgTemp, unitSystem)}
        </p>
      </div>

      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <span className="text-xs">{t('summary.solarTitle')}</span>
        </div>
        <div className="bg-secondary mt-2 flex h-2 w-full overflow-hidden rounded-full">
          <TooltipProvider delayDuration={100}>
            {weatherPoints.map((wp, i) => {
              const colors: Record<string, string> = {
                intense: 'bg-red-600',
                moderate: 'bg-orange-400',
                weak: 'bg-yellow-200',
                shade: 'bg-slate-500',
                night: 'bg-slate-900',
              };
              const intensityLabel =
                wp.solarIntensity === 'night'
                  ? t('solarExposure.night')
                  : t(`solarIntensity.${wp.solarIntensity}` as any);

              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      className={`${colors[wp.solarIntensity || 'shade']} cursor-help transition-opacity hover:opacity-80`}
                      style={{ width: `${100 / total}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="px-2 py-1 text-[10px]">
                    <p className="font-bold">{intensityLabel}</p>
                    <p className="text-muted-foreground">
                      km {wp.point.distanceFromStart.toFixed(1)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {intensePoints > 0 && (
            <span className="text-[9px] font-bold text-red-600">
              {t('summary.maxSolarLabel', { percent: getPercent(intensePoints) })}
            </span>
          )}
          {shadePoints > 0 && (
            <span className="text-[9px] font-bold text-slate-500">
              {t('summary.shadeLabel', { percent: getPercent(shadePoints) })}
            </span>
          )}
        </div>
      </div>

      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-xs">{t('summary.daylight')}</span>
        </div>
        {arrivesAtNight ? (
          <div className="text-destructive mt-1 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-bold tracking-tighter uppercase">
              {t('summary.nightArrival')}
            </span>
          </div>
        ) : (
          <p className="text-foreground mt-1 font-mono text-xl font-bold">
            {lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Wind className="h-4 w-4" />
          <span className="text-xs">{t('summary.maxWind')}</span>
        </div>
        <p className="text-foreground mt-1 font-mono text-xl font-bold">
          {formatWindSpeed(maxWind, windUnit).split(' ')[0]}{' '}
          <span className="text-muted-foreground text-sm font-normal">
            {formatWindSpeed(maxWind, windUnit).split(' ')[1]}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          {t('summary.gusts', { speed: formatWindSpeed(maxGusts, windUnit) })}
        </p>
      </div>
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          <span className="text-xs">{t('summary.precipProb')}</span>
        </div>
        <p className="text-foreground mt-1 font-mono text-xl font-bold">
          {avgPrecipProb.toFixed(0)}%
        </p>
      </div>
      <div className="border-border bg-card rounded-lg border p-3">
        <div className="text-muted-foreground flex items-center gap-2">
          <Wind className="h-4 w-4" />
          <span className="text-xs">{t('summary.wind')}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-primary text-xs font-medium">
            {t('summary.favor', { percent: tailwindPct.toFixed(0) })}
          </span>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-destructive text-xs font-medium">
            {t('summary.contra', { percent: headwindPct.toFixed(0) })}
          </span>
        </div>
      </div>
    </div>
  );
}
