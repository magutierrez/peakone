'use client';

import { Calendar as CalendarIcon, Clock, Gauge, Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { RouteConfig } from '@/lib/types';
import { useState, useEffect } from 'react';

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
  const initialHours = Math.floor(estimatedDuration / 60);
  const initialMinutes = Math.round(estimatedDuration % 60);

  const [manualHours, setManualHours] = useState(initialHours);
  const [manualMinutes, setManualMinutes] = useState(initialMinutes);

  // Sync manual inputs when speed/distance changes externally
  useEffect(() => {
    setManualHours(initialHours);
    setManualMinutes(initialMinutes);
  }, [config.speed, totalDistance]);

  const handleDurationChange = (h: number, m: number) => {
    const totalMinutes = h * 60 + m;
    if (totalMinutes > 0 && totalDistance > 0) {
      const newSpeed = (totalDistance / totalMinutes) * 60;
      // Clamp speed between 1 and 60
      const clampedSpeed = Math.max(1, Math.min(60, Math.round(newSpeed * 10) / 10));
      setConfig({ ...config, speed: clampedSpeed });
    }
    setManualHours(h);
    setManualMinutes(m);
  };

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
              <Popover>
                <PopoverTrigger asChild>
                  <button className="group flex items-center gap-1.5 hover:text-primary transition-colors text-left focus:outline-none">
                    <p className="text-foreground font-mono text-sm font-bold whitespace-nowrap group-hover:text-primary underline decoration-dotted underline-offset-4">
                      {t('durationFormat', {
                        hours: initialHours,
                        minutes: initialMinutes.toString().padStart(2, '0'),
                      })}
                    </p>
                    <Edit2 className="h-3 w-3 text-muted-foreground group-hover:text-primary opacity-50 group-hover:opacity-100" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 shadow-xl border-border bg-card" align="end">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-tight text-foreground">{t('estimatedDuration')}</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label className="text-[10px] text-muted-foreground font-bold uppercase">{t('hours')}</Label>
                        <Input 
                          type="number" 
                          min={0} 
                          max={99} 
                          value={manualHours}
                          onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0, manualMinutes)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="text-[10px] text-muted-foreground font-bold uppercase">{t('minutes')}</Label>
                        <Input 
                          type="number" 
                          min={0} 
                          max={59} 
                          value={manualMinutes}
                          onChange={(e) => handleDurationChange(manualHours, parseInt(e.target.value) || 0)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <input 
                        type="range"
                        min={0}
                        max={600} // 10 hours
                        step={5}
                        value={manualHours * 60 + manualMinutes}
                        onChange={(e) => {
                          const total = parseInt(e.target.value);
                          handleDurationChange(Math.floor(total / 60), total % 60);
                        }}
                        className="w-full accent-primary h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[10px] text-center text-muted-foreground italic leading-tight">
                        {t('adjustDurationDesc')}
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
