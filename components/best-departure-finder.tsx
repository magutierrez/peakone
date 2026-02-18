'use client';

import { useTranslations } from 'next-intl';
import { Clock, Star, Wind, Thermometer, CloudRain, Moon, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BestDepartureFinderProps {
  windows: any[];
  onSelect: (time: string) => void;
  isLoading: boolean;
  onFind: () => void;
}

export function BestDepartureFinder({ windows, onSelect, isLoading, onFind }: BestDepartureFinderProps) {
  const t = useTranslations('BestWindow');

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFind} 
          disabled={isLoading}
          className="h-7 text-[10px] uppercase font-bold tracking-tight"
        >
          {isLoading ? t('analyzing') : t('suggest')}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {windows.length > 0 ? (
          windows.slice(0, 4).map((window, idx) => {
            const time = new Date(window.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <Card 
                key={idx} 
                className={cn(
                  "cursor-pointer border-border/50 bg-secondary/20 hover:border-primary/50 transition-all",
                  idx === 0 && "border-primary/30 bg-primary/5"
                )}
                onClick={() => onSelect(window.startTime)}
              >
                <CardContent className="p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center bg-background rounded-lg p-2 border border-border/50 min-w-[50px]">
                      <Clock className="h-3 w-3 text-muted-foreground mb-1" />
                      <span className="text-xs font-bold">{time}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                          getScoreColor(window.score)
                        )}>
                          {window.score}/100
                        </span>
                        {idx === 0 && <span className="text-[9px] font-bold text-primary uppercase">{t('recommended')}</span>}
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" /> {Math.round(window.avgTemp)}°
                        </span>
                        <span className="flex items-center gap-1">
                          <Wind className="h-3 w-3" /> {Math.round(window.maxWind)} km/h
                        </span>
                        {window.maxPrecipProb > 10 && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <CloudRain className="h-3 w-3" /> {window.maxPrecipProb}%
                          </span>
                        )}
                        {window.isNight && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Moon className="h-3 w-3" /> {t('night')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <CheckCircle2 className={cn(
                    "h-4 w-4 text-muted-foreground/30",
                    idx === 0 && "text-primary"
                  )} />
                </CardContent>
              </Card>
            );
          })
        ) : (
          !isLoading && (
            <div className="p-6 border-2 border-dashed border-border rounded-xl text-center">
              <Info className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-20" />
              <p className="text-[11px] text-muted-foreground italic">
                {t('description')}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
