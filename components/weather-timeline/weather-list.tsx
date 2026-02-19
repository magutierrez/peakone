'use client';

import { Wind, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sun, Moon, Cloud } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { WeatherIcon } from '@/components/weather-icon';
import { WEATHER_CODES } from '@/lib/types';
import type { RouteWeatherPoint } from '@/lib/types';
import { useSettings } from '@/hooks/use-settings';
import { formatTemperature, formatWindSpeed, formatDistance } from '@/lib/utils';

interface WeatherListProps {
  weatherPoints: RouteWeatherPoint[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function getSolarIcon(exposure: string) {
  switch (exposure) {
    case 'sun':
      return <Sun className="h-3 w-3 fill-amber-500/20 text-amber-500" />;
    case 'shade':
      return <Cloud className="h-3 w-3 fill-slate-400/20 text-slate-400" />;
    case 'night':
      return <Moon className="h-3 w-3 fill-indigo-400/20 text-indigo-400" />;
    default:
      return null;
  }
}

function getSolarIntensityColor(intensity: string) {
  switch (intensity) {
    case 'night':
      return 'bg-slate-900 text-slate-200';
    case 'shade':
      return 'bg-slate-500 text-white';
    case 'weak':
      return 'bg-yellow-200 text-yellow-800';
    case 'moderate':
      return 'bg-orange-400 text-white';
    case 'intense':
      return 'bg-red-600 text-white';
    default:
      return 'bg-secondary/30 text-muted-foreground';
  }
}

function getWindEffectIcon(effect: string) {
  switch (effect) {
    case 'tailwind':
      return <ArrowDown className="text-primary h-3.5 w-3.5" />;
    case 'headwind':
      return <ArrowUp className="text-destructive h-3.5 w-3.5" />;
    case 'crosswind-left':
      return <ArrowLeft className="text-accent h-3.5 w-3.5" />;
    case 'crosswind-right':
      return <ArrowRight className="text-accent h-3.5 w-3.5" />;
    default:
      return null;
  }
}

export function WeatherList({ weatherPoints, selectedIndex, onSelect }: WeatherListProps) {
  const t = useTranslations('WeatherTimeline');
  const tw = useTranslations('WeatherCodes');
  const { unitSystem, windUnit } = useSettings();

  return (
    <div className="w-full overflow-hidden">
      <h3 className="text-foreground mb-3 text-sm font-semibold">{t('timelineTitle')}</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max gap-2 pb-4">
          {weatherPoints.map((wp, idx) => {
            const time = wp.point.estimatedTime
              ? new Date(wp.point.estimatedTime)
              : new Date(wp.weather.time);
            const locale = 'es-ES';
            const timeStr = time.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            });
            const hasTranslation = !!tw.raw(wp.weather.weatherCode.toString());
            const weatherDescription = hasTranslation
              ? tw(wp.weather.weatherCode.toString() as any)
              : WEATHER_CODES[wp.weather.weatherCode]?.description || t('unknownWeather');
            const isSelected = selectedIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (onSelect) {
                    onSelect(idx);
                  }
                }}
                className={`flex shrink-0 flex-col items-center gap-1.5 rounded-lg border p-3 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
                style={{ minWidth: '100px' }}
              >
                <span className="text-foreground font-mono text-xs font-bold">{timeStr}</span>
                <span className="text-muted-foreground text-[10px]">
                  {formatDistance(wp.point.distanceFromStart, unitSystem)}
                </span>

                {wp.solarIntensity && (
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 ${getSolarIntensityColor(wp.solarIntensity)}`}
                  >
                    {getSolarIcon(wp.solarExposure || 'sun')}
                    <span className="text-[9px] font-bold tracking-tight uppercase">
                      {wp.solarIntensity === 'night'
                        ? t('solarExposure.night')
                        : t(`solarIntensity.${wp.solarIntensity}` as any)}
                    </span>
                  </div>
                )}

                <WeatherIcon code={wp.weather.weatherCode} className="h-6 w-6" />
                <span className="text-muted-foreground text-[10px]">{weatherDescription}</span>
                <span className="text-foreground font-mono text-sm font-bold">
                  {formatTemperature(wp.weather.temperature, unitSystem)}
                </span>
                <div className="flex items-center gap-1">
                  <Wind className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {formatWindSpeed(wp.weather.windSpeed, windUnit)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getWindEffectIcon(wp.windEffect)}
                  <span
                    className={`text-[10px] font-medium ${
                      wp.windEffect === 'tailwind'
                        ? 'text-primary'
                        : wp.windEffect === 'headwind'
                          ? 'text-destructive'
                          : 'text-accent'
                    }`}
                  >
                    {t(`windEffect.${wp.windEffect}` as any)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
