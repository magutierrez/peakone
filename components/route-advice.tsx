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
  Zap
} from 'lucide-react';
import type { RouteWeatherPoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface RouteAdviceProps {
  weatherPoints: RouteWeatherPoint[];
  activityType: 'cycling' | 'walking';
}

export function RouteAdvice({ weatherPoints, activityType }: RouteAdviceProps) {
  const t = useTranslations('Advice');
  const typeKey = activityType === 'cycling' ? 'cycling' : 'hiking';

  if (weatherPoints.length === 0) return null;

  // Analysis
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
    <div className="flex flex-col gap-4">
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
