'use client';

import { Wind, Thermometer, Droplets, Sun, Clock, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';
import { getSunPosition } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeatherSummaryProps {
  weatherPoints: RouteWeatherPoint[];
}

export function WeatherSummary({ weatherPoints }: WeatherSummaryProps) {
  const t = useTranslations('WeatherTimeline');

  if (weatherPoints.length === 0) return null;

  const avgTemp =
    weatherPoints.reduce((s, w) => s + w.weather.temperature, 0) / weatherPoints.length;
  const maxWind = Math.max(...weatherPoints.map((w) => w.weather.windSpeed));
  const maxGusts = Math.max(...weatherPoints.map((w) => w.weather.windGusts));
  const avgPrecipProb =
    weatherPoints.reduce((s, w) => s + w.weather.precipitationProbability, 0) /
    weatherPoints.length;
  const tailwindPercent =
    (weatherPoints.filter((w) => w.windEffect === 'tailwind').length / weatherPoints.length) * 100;
  const headwindPercent =
    (weatherPoints.filter((w) => w.windEffect === 'headwind').length / weatherPoints.length) * 100;

  // Solar Summary
  const intensePoints = weatherPoints.filter((w) => w.solarIntensity === 'intense').length;
  const shadePoints = weatherPoints.filter((w) => w.solarIntensity === 'shade').length;
  const total = weatherPoints.length;
  const getPercent = (count: number) => ((count / total) * 100).toFixed(0);

  // Daylight remaining calculation
  const lastPoint = weatherPoints[weatherPoints.length - 1];
  const lastTime = new Date(lastPoint.weather.time);
  
  // Find sunset time at the last location
  // We approximate sunset by checking when altitude goes below -0.833 (standard sunset)
  // But for simplicity, we can just use the last point's sun position vs current time
  const now = new Date();
  const sunPosAtLast = getSunPosition(lastTime, lastPoint.point.lat, lastPoint.point.lon);
  const arrivesAtNight = sunPosAtLast.altitude < 0;

  // Estimate remaining daylight from "now" until sunset at the current/route location
  // This is a simplified version for the prototype
  const firstPoint = weatherPoints[0];
  const sunPosFirst = getSunPosition(now, firstPoint.point.lat, firstPoint.point.lon);
  
  // Approximation of sunset: simplified for UI
  // In a real app we would use a more robust sunset calc
  const isNightSoon = sunPosAtLast.altitude < 5 && sunPosAtLast.altitude > -5;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Thermometer className="h-4 w-4" />
          <span className="text-xs">{t('summary.avgTemp')}</span>
        </div>
        <p className="mt-1 font-mono text-xl font-bold text-foreground">{avgTemp.toFixed(1)}°C</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sun className="h-4 w-4" />
          <span className="text-xs">{t('summary.solarTitle')}</span>
        </div>
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
          <TooltipProvider delayDuration={100}>
            {weatherPoints.map((wp, i) => {
              const colors: Record<string, string> = {
                intense: 'bg-red-600',
                moderate: 'bg-orange-400',
                weak: 'bg-yellow-200',
                shade: 'bg-slate-500',
                night: 'bg-slate-900'
              };
              const intensityLabel = wp.solarIntensity === 'night' 
                ? t('solarExposure.night') 
                : t(`solarIntensity.${wp.solarIntensity}` as any);
                
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div 
                      className={`${colors[wp.solarIntensity || 'shade']} cursor-help transition-opacity hover:opacity-80`} 
                      style={{ width: `${100/total}%` }} 
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] px-2 py-1">
                    <p className="font-bold">{intensityLabel}</p>
                    <p className="text-muted-foreground">km {wp.point.distanceFromStart.toFixed(1)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {intensePoints > 0 && <span className="text-[9px] font-bold text-red-600">{getPercent(intensePoints)}% Sol Máx</span>}
          {shadePoints > 0 && <span className="text-[9px] font-bold text-slate-500">{getPercent(shadePoints)}% Sombra</span>}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs">{t('summary.daylight')}</span>
        </div>
        {arrivesAtNight ? (
          <div className="mt-1 flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-tighter">{t('summary.nightArrival')}</span>
          </div>
        ) : (
          <p className="mt-1 font-mono text-xl font-bold text-foreground">
            {lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wind className="h-4 w-4" />
          <span className="text-xs">{t('summary.maxWind')}</span>
        </div>
        <p className="mt-1 font-mono text-xl font-bold text-foreground">
          {maxWind.toFixed(0)}{' '}
          <span className="text-sm font-normal text-muted-foreground">{t('summary.kmh')}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t('summary.gusts', { speed: maxGusts.toFixed(0) })}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Droplets className="h-4 w-4" />
          <span className="text-xs">{t('summary.precipProb')}</span>
        </div>
        <p className="mt-1 font-mono text-xl font-bold text-foreground">
          {avgPrecipProb.toFixed(0)}%
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wind className="h-4 w-4" />
          <span className="text-xs">{t('summary.wind')}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs font-medium text-primary">
            {t('summary.favor', { percent: tailwindPercent.toFixed(0) })}
          </span>
          <span className="text-xs text-muted-foreground">/</span>
          <span className="text-xs font-medium text-destructive">
            {t('summary.contra', { percent: headwindPercent.toFixed(0) })}
          </span>
        </div>
      </div>
    </div>
  );
}
