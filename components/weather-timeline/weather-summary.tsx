'use client';

import { Wind, Thermometer, Droplets } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';

interface WeatherSummaryProps {
  weatherPoints: RouteWeatherPoint[];
}

export function WeatherSummary({ weatherPoints }: WeatherSummaryProps) {
  const t = useTranslations('WeatherTimeline');

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

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Thermometer className="h-4 w-4" />
          <span className="text-xs">{t('summary.avgTemp')}</span>
        </div>
        <p className="mt-1 font-mono text-xl font-bold text-foreground">{avgTemp.toFixed(1)}°C</p>
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
