'use client';

import {
  Wind,
  Thermometer,
  Droplets,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Cloud,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WeatherIcon } from '@/components/weather-icon';
import { WindArrow } from '@/components/wind-arrow';
import { WEATHER_CODES } from '@/lib/types';
import type { RouteWeatherPoint } from '@/lib/types';

interface WeatherPointDetailProps {
  point: RouteWeatherPoint;
}

function getSolarIcon(exposure: string) {
  switch (exposure) {
    case 'sun':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'shade':
      return <Cloud className="h-4 w-4 text-slate-400" />;
    case 'night':
      return <Moon className="h-4 w-4 text-indigo-400" />;
    default:
      return null;
  }
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="h-3.5 w-3.5 text-primary" />;
    case 'headwind':
      return <ArrowUp className="h-3.5 w-3.5 text-destructive" />;
    case 'crosswind-left':
      return <ArrowLeft className="h-3.5 w-3.5 text-accent" />;
    case 'crosswind-right':
      return <ArrowRight className="h-3.5 w-3.5 text-accent" />;
    default:
      return null;
  }
}

export function WeatherPointDetail({ point }: WeatherPointDetailProps) {
  const t = useTranslations('WeatherTimeline');
  const tw = useTranslations('WeatherCodes');
  const time = new Date(point.weather.time);
  const locale = 'es-ES';
  const timeStr = time.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = time.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const hasTranslation = !!tw.raw(point.weather.weatherCode.toString());
  const weatherDescription = hasTranslation
    ? tw(point.weather.weatherCode.toString() as any)
    : WEATHER_CODES[point.weather.weatherCode]?.description || t('unknownWeather');

  const windEffectLabel = t(`windEffect.${point.windEffect}` as any).toLowerCase();

  return (
    <div className="rounded-lg border border-primary/20 bg-card p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
          <p className="font-mono text-2xl font-bold text-foreground">{timeStr}</p>
          <p className="text-xs text-muted-foreground">
            km {point.point.distanceFromStart.toFixed(1)}
          </p>
          {point.point.ele !== undefined && (
            <p className="text-xs text-muted-foreground">
              {t('detail.altitude', { ele: Math.round(point.point.ele) })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <WeatherIcon code={point.weather.weatherCode} className="h-10 w-10" />
          <span className="text-center text-xs text-muted-foreground">{weatherDescription}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {/* Temperature */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <Thermometer className="h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">{t('detail.temperature')}</p>
            <p className="font-mono text-sm font-bold text-foreground">
              {point.weather.temperature}°C
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t('detail.feelsLike', { temp: point.weather.apparentTemperature })}
            </p>
          </div>
        </div>

        {/* Solar Exposure */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          {point.solarExposure && getSolarIcon(point.solarExposure)}
          <div>
            <p className="text-xs text-muted-foreground">Exposición Solar</p>
            <p className="font-mono text-sm font-bold text-foreground capitalize">
              {point.solarExposure ? t(`solarExposure.${point.solarExposure}` as any) : '-'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {point.weather.directRadiation !== undefined 
                ? `${Math.round(point.weather.directRadiation)} W/m²` 
                : '-'}
            </p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <WindArrow
            direction={point.weather.windDirection}
            travelBearing={point.bearing}
            effect={point.windEffect}
            size={36}
          />
          <div>
            <p className="text-xs text-muted-foreground">{t('detail.wind')}</p>
            <p className="font-mono text-sm font-bold text-foreground">
              {point.weather.windSpeed} km/h
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t('detail.gusts', { speed: point.weather.windGusts })}
            </p>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <Droplets className="h-4 w-4 shrink-0 text-chart-2" />
          <div>
            <p className="text-xs text-muted-foreground">{t('detail.rain')}</p>
            <p className="font-mono text-sm font-bold text-foreground">
              {point.weather.precipitation}mm
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t('detail.prob', { percent: point.weather.precipitationProbability })}
            </p>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">{t('detail.visibility')}</p>
            <p className="font-mono text-sm font-bold text-foreground">
              {(point.weather.visibility / 1000).toFixed(1)} km
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t('detail.clouds', { percent: point.weather.cloudCover })}
            </p>
          </div>
        </div>
      </div>

      {/* Wind effect summary */}
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3">
        {getWindEffectIcon(point.windEffect)}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {t('windEffect.summary', { label: windEffectLabel })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('windEffect.relativeAngle', { angle: point.windEffectAngle.toFixed(0) })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t('windEffect.bearing')}</p>
          <p className="font-mono text-sm font-bold text-foreground">{point.bearing.toFixed(0)}°</p>
        </div>
      </div>
    </div>
  );
}
