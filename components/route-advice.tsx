'use client';

import { useTranslations } from 'next-intl';
import { 
  Lightbulb, 
  Wind, 
  CloudRain, 
  ThermometerSun, 
  ThermometerSnowflake, 
  Moon, 
  AlertCircle,
  ShieldCheck,
  Zap,
  Droplets
} from 'lucide-react';
import type { RouteWeatherPoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { calculatePhysiologicalNeeds } from '@/lib/utils';

interface RouteAdviceProps {
  weatherPoints: RouteWeatherPoint[];
  activityType: 'cycling' | 'walking';
}

export function RouteAdvice({ weatherPoints, activityType }: RouteAdviceProps) {
  const t = useTranslations('Advice');
  const tp = useTranslations('physiology');
  const typeKey = activityType === 'cycling' ? 'cycling' : 'hiking';

  if (weatherPoints.length === 0) return null;

  // Analysis
  const firstPoint = weatherPoints[0];
  const lastPoint = weatherPoints[weatherPoints.length - 1];
  const durationHours = (new Date(lastPoint.weather.time).getTime() - new Date(firstPoint.weather.time).getTime()) / 3600000;
  const distance = lastPoint.point.distanceFromStart;
  const elevationGain = weatherPoints.reduce((acc, curr, i) => {
    if (i === 0) return 0;
    const diff = (curr.point.ele || 0) - (weatherPoints[i-1].point.ele || 0);
    return acc + Math.max(0, diff);
  }, 0);
  const avgTemp = weatherPoints.reduce((acc, curr) => acc + curr.weather.temperature, 0) / weatherPoints.length;

  const needs = calculatePhysiologicalNeeds(durationHours, distance, elevationGain, avgTemp, activityType);

  const hasRain = weatherPoints.some(wp => wp.weather.precipitation > 0.5);
  const hasStrongWind = weatherPoints.some(wp => wp.weather.windSpeed > 30 || wp.weather.windGusts > 50);
  const hasHeat = weatherPoints.some(wp => wp.weather.temperature > 28 || wp.solarIntensity === 'intense');
  const hasCold = weatherPoints.some(wp => wp.weather.temperature < 8);
  const hasNight = weatherPoints.some(wp => wp.solarIntensity === 'night');

  const advices = [
    {
      condition: hasRain,
      icon: <CloudRain className="h-5 w-5 text-blue-500" />,
      text: t(`${typeKey}.rain`),
      category: t('weather')
    },
    {
      condition: hasStrongWind,
      icon: <Wind className="h-5 w-5 text-slate-500" />,
      text: t(`${typeKey}.wind`),
      category: t('weather')
    },
    {
      condition: hasHeat,
      icon: <ThermometerSun className="h-5 w-5 text-orange-500" />,
      text: t(`${typeKey}.heat`),
      category: t('nutrition')
    },
    {
      condition: hasCold,
      icon: <ThermometerSnowflake className="h-5 w-5 text-cyan-500" />,
      text: t(`${typeKey}.cold`),
      category: t('gear')
    },
    {
      condition: hasNight,
      icon: <Moon className="h-5 w-5 text-indigo-500" />,
      text: t(`${typeKey}.night`),
      category: t('safety')
    },
    {
      condition: true, // General advice
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      text: t(`${typeKey}.general`),
      category: t('safety')
    }
  ].filter(a => a.condition);

  return (
    <div className="flex flex-col gap-6">
      {/* Physiology Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tp('calories')} ({tp('total')})
              </p>
              <p className="text-xl font-mono font-bold text-foreground">
                {needs.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                ~{Math.round(needs.calories / durationHours)} kcal {tp('perHour')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-accent/10 p-2 rounded-full">
              <Droplets className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {tp('hydration')} ({tp('total')})
              </p>
              <p className="text-xl font-mono font-bold text-foreground">
                {needs.waterLiters} <span className="text-xs font-normal text-muted-foreground">L</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                ~{Math.round((needs.waterLiters * 1000) / durationHours)} ml {tp('perHour')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {advices.map((advice, i) => (
          <Card key={i} className="border-border/50 bg-secondary/20 overflow-hidden">
            <CardContent className="p-4 flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {advice.icon}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {advice.category}
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {advice.text}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
