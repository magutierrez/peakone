import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  Activity,
  RefreshCcw, // New import
} from 'lucide-react';
import type { RouteWeatherPoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // New import
import { analyzeRouteSegments } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface RouteHazardsProps {
  weatherPoints: RouteWeatherPoint[];
  onSelectSegment?: (range: { start: number; end: number } | null) => void;
  onClearSelection?: () => void;
}

const segmentIcons: Record<string, any> = {
  steepClimb: <TrendingUp className="h-4 w-4" />,
  steepDescent: <TrendingDown className="h-4 w-4" />,
  heatStress: <Flame className="h-4 w-4" />,
  effort: <Activity className="h-4 w-4" />,
};

const segmentColors: Record<string, string> = {
  steepClimb: 'text-red-600 bg-red-500/10 border-red-200',
  steepDescent: 'text-orange-600 bg-orange-500/10 border-orange-200',
  heatStress: 'text-amber-600 bg-amber-500/10 border-amber-200',
  effort: 'text-blue-600 bg-blue-500/10 border-blue-200',
};

export function RouteHazards({
  weatherPoints,
  onSelectSegment,
  onClearSelection,
}: RouteHazardsProps) {
  const t = useTranslations('Hazards');
  const tRouteMap = useTranslations('RouteMap'); // New translation import

  if (weatherPoints.length === 0) return null;

  const segments = analyzeRouteSegments(weatherPoints);

  // Take the most relevant segments (highest danger first, up to 8)
  const sortedSegments = [...segments]
    .sort((a, b) => {
      const levels = ['low', 'medium', 'high'];
      return (
        levels.indexOf(b.dangerLevel) - levels.indexOf(a.dangerLevel) || b.maxSlope - a.maxSlope
      );
    })
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          className="bg-card/90 hover:bg-card h-8 gap-2 shadow-md"
          onClick={onClearSelection}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {tRouteMap('resetView')}
          </span>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedSegments.map((seg, idx) => {
          const chartData = seg.points.map((p: any) => ({
            dist: p.point.distanceFromStart,
            ele: p.point.ele || 0,
          }));

          const distance = seg.endDist - seg.startDist;

          return (
            <Card
              key={idx}
              className="border-border/50 bg-card hover:border-primary/50 cursor-pointer overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
              onClick={() => onSelectSegment?.({ start: seg.startDist, end: seg.endDist })}
            >
              <CardContent className="p-0">
                <div className="border-border/50 bg-muted/30 flex items-start justify-between border-b p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${segmentColors[seg.type]}`}>
                      {segmentIcons[seg.type]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-foreground text-sm leading-tight font-bold">
                          {t(seg.type)}
                        </h4>
                        {seg.climbCategory && seg.climbCategory !== 'none' && (
                          <Badge
                            variant="outline"
                            className="bg-primary/5 border-primary/20 text-primary h-4 px-1 text-[8px] font-bold"
                          >
                            CAT {seg.climbCategory}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                        km {seg.startDist.toFixed(1)} - {distance.toFixed(1)} km {t('distance')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                      <Activity className="h-3 w-3" />
                      {Math.round(seg.avgSlope)}% {t('avg')}
                    </Badge>
                  </div>
                </div>

                <div className="bg-secondary/5 h-24 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'}
                            stopOpacity={0}
                          />
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

                <div className="bg-muted/10 flex items-center justify-between px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[9px] font-bold uppercase">
                      {t('slope')}
                    </span>
                    <span className="text-xs font-bold">
                      {Math.round(seg.maxSlope)}% {t('max')}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground text-[9px] font-bold uppercase">
                      {t('danger')}
                    </span>
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
        <div className="border-border rounded-xl border-2 border-dashed p-12 text-center">
          <Zap className="text-muted-foreground mx-auto mb-3 h-8 w-8 opacity-20" />
          <p className="text-muted-foreground text-sm italic">{t('noSegments')}</p>
        </div>
      )}
    </div>
  );
}
