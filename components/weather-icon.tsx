'use client';

import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  CloudRainWind,
} from 'lucide-react';
import { WEATHER_CODES } from '@/lib/types';

interface WeatherIconProps {
  code: number;
  className?: string;
}

export function WeatherIcon({ code, className = 'h-5 w-5' }: WeatherIconProps) {
  const info = WEATHER_CODES[code];
  const iconName = info?.icon || 'cloud';

  switch (iconName) {
    case 'sun':
      return <Sun className={`${className} text-accent`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-accent`} />;
    case 'cloud':
      return <Cloud className={`${className} text-muted-foreground`} />;
    case 'cloud-fog':
      return <CloudFog className={`${className} text-muted-foreground`} />;
    case 'cloud-drizzle':
      return <CloudDrizzle className={`${className} text-chart-2`} />;
    case 'cloud-rain':
      return <CloudRain className={`${className} text-chart-2`} />;
    case 'cloud-rain-wind':
      return <CloudRainWind className={`${className} text-chart-2`} />;
    case 'snowflake':
      return <Snowflake className={`${className} text-foreground`} />;
    case 'cloud-lightning':
      return <CloudLightning className={`${className} text-accent`} />;
    default:
      return <Cloud className={`${className} text-muted-foreground`} />;
  }
}
