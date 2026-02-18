'use client';

import { useTranslations } from 'next-intl';
import { Clock, Star, Wind, Thermometer, CloudRain, Moon, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatTemperature, formatWindSpeed } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

interface BestDepartureFinderProps {
  windows: any[];
  onSelect: (time: string) => void;
  isLoading: boolean;
  onFind: () => void;
  onAnalyze: (time: string) => void;
}

export function BestDepartureFinder({ windows, onSelect, isLoading, onFind, onAnalyze }: BestDepartureFinderProps) {
  const t = useTranslations('BestWindow');
  const { unitSystem, windUnit } = useSettings();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('rain')) return <CloudRain className="h-3 w-3" />;
    if (reason.includes('wind')) return <Wind className="h-3 w-3" />;
    if (reason.includes('temp')) return <Thermometer className="h-3 w-3" />;
    if (reason.includes('daylight')) return <Star className="h-3 w-3" />;
    if (reason.includes('night')) return <Moon className="h-3 w-3" />;
    return <Info className="h-3 w-3" />;
  };

  const isPositiveReason = (reason: string) => {
    return ['no_rain', 'wind_calm', 'temp_perfect', 'daylight_ok', 'wind_favor'].includes(reason);
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

      <div className="flex flex-col gap-3">
        {windows.length > 0 ? (
          windows.slice(0, 4).map((window, idx) => {
            const time = new Date(window.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <Card 
                key={idx} 
                className={cn(
                  "border-border/50 bg-secondary/20 hover:border-primary/30 transition-all overflow-hidden",
                )}
              >
                <CardContent className="p-0">
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center bg-background rounded-xl p-3 border border-border/50 min-w-[65px] shadow-sm">
                        <Clock className="h-4 w-4 text-primary mb-1" />
                        <span className="text-sm font-bold">{time}</span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm",
                            getScoreColor(window.score)
                          )}>
                            {window.score}/100
                          </span>
                          {idx === 0 && <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{t('recommended')}</span>}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-1.5 mt-1">
                          {window.reasons?.map((reason: string, rIdx: number) => (
                            <div key={rIdx} className={cn(
                              "flex items-center gap-2 text-[10px] font-medium",
                              isPositiveReason(reason) ? "text-emerald-600" : "text-rose-500"
                            )}>
                              <span className="shrink-0">{getReasonIcon(reason)}</span>
                              <span className="leading-none">{t(`reasons.${reason}`)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-col text-[10px] text-muted-foreground items-end font-mono">
                        <span className="flex items-center gap-1 font-bold text-foreground">
                          {t('temp')} {formatTemperature(window.avgTemp, unitSystem)}
                        </span>
                        <span>{t('wind')} {formatWindSpeed(window.maxWind, windUnit)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 border-t border-border/50 p-2 flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => onSelect(window.startTime)}
                    >
                      {t('set_time')}
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-7 px-3 text-[10px] font-bold bg-primary shadow-sm hover:shadow-md transition-all"
                      onClick={() => onAnalyze(window.startTime)}
                    >
                      {t('analyze')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          !isLoading && (
            <div className="p-8 border-2 border-dashed border-border rounded-2xl text-center bg-muted/5">
              <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-xs text-muted-foreground italic leading-relaxed px-4">
                {t('description')}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
