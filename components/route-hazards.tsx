import { useTranslations } from 'next-intl';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Zap,
  Activity
} from 'lucide-react';
import type { RouteWeatherPoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyzeRouteSegments } from '@/lib/utils';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis
} from 'recharts';

interface RouteHazardsProps {
  weatherPoints: RouteWeatherPoint[];
  onSelectSegment?: (range: { start: number; end: number } | null) => void;
}

const segmentIcons: Record<string, any> = {
  steepClimb: <TrendingUp className="h-4 w-4" />,
  steepDescent: <TrendingDown className="h-4 w-4" />,
  heatStress: <Flame className="h-4 w-4" />,
  effort: <Activity className="h-4 w-4" />
};

const segmentColors: Record<string, string> = {
  steepClimb: 'text-red-600 bg-red-500/10 border-red-200',
  steepDescent: 'text-orange-600 bg-orange-500/10 border-orange-200',
  heatStress: 'text-amber-600 bg-amber-500/10 border-amber-200',
  effort: 'text-blue-600 bg-blue-500/10 border-blue-200'
};

export function RouteHazards({ weatherPoints, onSelectSegment }: RouteHazardsProps) {
  const t = useTranslations('Hazards');

  if (weatherPoints.length === 0) return null;

  const segments = analyzeRouteSegments(weatherPoints);

  // Take the most relevant segments (highest danger first, up to 8)
  const sortedSegments = [...segments]
    .sort((a, b) => {
      const levels = ['low', 'medium', 'high'];
      return levels.indexOf(b.dangerLevel) - levels.indexOf(a.dangerLevel) || b.maxSlope - a.maxSlope;
    })
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedSegments.map((seg, idx) => {
          const chartData = seg.points.map((p: any) => ({
            dist: p.point.distanceFromStart,
            ele: p.point.ele || 0
          }));

          const distance = seg.endDist - seg.startDist;

          return (
            <Card 
              key={idx} 
              className="border-border/50 bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-md cursor-pointer active:scale-[0.98]"
              onClick={() => onSelectSegment?.({ start: seg.startDist, end: seg.endDist })}
            >
              <CardContent className="p-0">
                <div className="p-4 flex items-start justify-between border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${segmentColors[seg.type]}`}>
                      {segmentIcons[seg.type]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground leading-tight">
                        {t(seg.type)}
                      </h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        km {seg.startDist.toFixed(1)} - {distance.toFixed(1)} km {t('distance')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                    <Activity className="h-3 w-3" />
                    {Math.round(seg.maxSlope)}%
                  </Badge>
                </div>
                
                <div className="h-24 w-full bg-secondary/5 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="linear" 
                        dataKey="ele" 
                        stroke={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'} 
                        strokeWidth={2}
                        fill={`url(#grad-${idx})`}
                        isAnimationActive={false}
                      />
                      <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="px-4 py-2 flex items-center justify-between bg-muted/10">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold">{t('slope')}</span>
                    <span className="text-xs font-bold">{Math.round(seg.maxSlope)}% {t('max')}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase text-muted-foreground font-bold">{t('danger')}</span>
                    <span className={`text-xs font-bold uppercase ${seg.dangerColor}`}>
                      {t(`levels.${seg.dangerLevel}`)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {sortedSegments.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
          <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground italic">{t('noSegments')}</p>
        </div>
      )}
    </div>
  );
}
