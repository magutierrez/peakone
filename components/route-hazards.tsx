'use client';

import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  Activity,
  RefreshCcw,
} from 'lucide-react';
import type { RouteWeatherPoint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { analyzeRouteSegments } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer, YAxis, ReferenceLine, Tooltip } from 'recharts';
import { useRef } from 'react';

interface RouteHazardsProps {
  weatherPoints: RouteWeatherPoint[];
  allPoints?: any[];
  onSelectSegment?: (range: { start: number; end: number } | null) => void;
  onSelectPoint?: (point: any | null) => void;
  setActiveFilter?: (filter: { key: 'pathType' | 'surface' | 'hazard'; value: string } | null) => void;
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

const getSlopeColorHex = (slope: number) => {
  const absSlope = Math.abs(slope);
  if (absSlope <= 1) return '#10b981'; 
  if (absSlope < 5) return '#f59e0b';  
  if (absSlope < 10) return '#ef4444'; 
  return '#991b1b';                    
};

export function RouteHazards({
  weatherPoints,
  allPoints = [],
  onSelectSegment,
  onSelectPoint,
  setActiveFilter,
  onClearSelection,
}: RouteHazardsProps) {
  const t = useTranslations('Hazards');
  const tRouteMap = useTranslations('RouteMap');
  const lastUpdateRef = useRef<number>(0);

  if (weatherPoints.length === 0) return null;

  const segments = analyzeRouteSegments(weatherPoints);

  const sortedSegments = [...segments]
    .sort((a, b) => {
      const levels = ['low', 'medium', 'high'];
      return (
        levels.indexOf(b.dangerLevel) - levels.indexOf(a.dangerLevel) || b.maxSlope - a.maxSlope
      );
    })
    .slice(0, 8);

  const handleCardClick = (seg: any) => {
    onSelectSegment?.({ start: seg.startDist, end: seg.endDist });
    setActiveFilter?.({ key: 'hazard', value: `${seg.startDist}-${seg.endDist}` });
  };

  const handleMouseMove = (e: any, segmentPoints: any[]) => {
    if (e && e.activePayload && e.activePayload[0] && onSelectPoint) {
      const activeDist = e.activePayload[0].payload.dist;
      const now = Date.now();

      if (now - lastUpdateRef.current > 16) {
        // Find the precise point in the dense list
        let p1 = segmentPoints[0];
        let p2 = segmentPoints[1];
        
        for (let i = 0; i < segmentPoints.length - 1; i++) {
          if (activeDist >= segmentPoints[i].distanceFromStart && activeDist <= segmentPoints[i+1].distanceFromStart) {
            p1 = segmentPoints[i];
            p2 = segmentPoints[i+1];
            break;
          }
        }

        if (p1 && p2) {
          const segmentDist = p2.distanceFromStart - p1.distanceFromStart;
          const ratio = segmentDist > 0 ? (activeDist - p1.distanceFromStart) / segmentDist : 0;

          onSelectPoint({
            lat: p1.lat + (p2.lat - p1.lat) * ratio,
            lon: p1.lon + (p2.lon - p1.lon) * ratio,
            ele: (p1.ele || 0) + ((p2.ele || 0) - (p1.ele || 0)) * ratio,
            distanceFromStart: activeDist
          });
        }
        lastUpdateRef.current = now;
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          className="bg-card/90 hover:bg-card h-8 gap-2 shadow-md"
          onClick={() => {
            onClearSelection?.();
            setActiveFilter?.(null);
            onSelectPoint?.(null);
          }}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {tRouteMap('resetView')}
          </span>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedSegments.map((seg, idx) => {
          const densePoints = allPoints.length > 0 
            ? allPoints.filter(p => p.distanceFromStart >= seg.startDist && p.distanceFromStart <= seg.endDist)
            : seg.points.map(wp => wp.point);

          const chartData = densePoints.map((p: any, pIdx: number) => {
            let slope = 0;
            if (pIdx > 0) {
              const prev = densePoints[pIdx - 1];
              const distDiff = (p.distanceFromStart - prev.distanceFromStart) * 1000;
              const eleDiff = (p.ele || 0) - (prev.ele || 0);
              if (distDiff > 0.1) {
                slope = (eleDiff / distDiff) * 100;
              }
            }
            return {
              dist: p.distanceFromStart,
              ele: p.ele || 0,
              slope: Math.abs(slope),
              color: getSlopeColorHex(slope)
            };
          });

          const minEle = Math.min(...chartData.map(d => d.ele));
          const maxEle = Math.max(...chartData.map(d => d.ele));
          const distance = seg.endDist - seg.startDist;

          const maxSlopePoint = chartData.reduce((prev, current) => 
            (current.slope > prev.slope) ? current : prev, chartData[0]
          );

          return (
            <Card
              key={idx}
              className="border-border/50 bg-card hover:border-primary/50 cursor-pointer overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
              onClick={() => handleCardClick(seg)}
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
                    <Badge variant="outline" className="gap-1 font-mono text-[10px] bg-background/50">
                      <Activity className="h-3 w-3" />
                      {Math.round(seg.avgSlope)}% {t('avg')}
                    </Badge>
                    <span className="text-[9px] font-bold text-muted-foreground tabular-nums">
                      {Math.round(minEle)}m - {Math.round(maxEle)}m
                    </span>
                  </div>
                </div>

                <div className="bg-secondary/5 h-28 w-full relative group cursor-crosshair">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={chartData} 
                      margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                      onMouseMove={(e) => handleMouseMove(e, densePoints)}
                      onMouseLeave={() => onSelectPoint?.(null)}
                    >
                      <defs>
                        <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="1" y2="0">
                          {chartData.length > 1 && chartData.map((d, i) => (
                            <stop 
                              key={i} 
                              offset={`${(i / (chartData.length - 1)) * 100}%`} 
                              stopColor={d.color} 
                            />
                          ))}
                        </linearGradient>
                        <linearGradient id={`fill-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={seg.dangerLevel === 'high' ? '#ef4444' : '#f59e0b'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm p-2 shadow-xl animate-in fade-in zoom-in duration-200">
                                <div className="flex flex-col gap-0.5 min-w-[60px]">
                                  <span className="text-[10px] font-black font-mono text-foreground flex items-center justify-between">
                                    {Math.round(data.ele)}m
                                    <span className="ml-2 px-1 rounded bg-secondary text-primary">{Math.round(data.slope)}%</span>
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.2, strokeDasharray: '3 3' }}
                      />
                      <Area
                        type="linear"
                        dataKey="ele"
                        stroke={`url(#grad-${idx})`}
                        strokeWidth={3}
                        fill={`url(#fill-${idx})`}
                        isAnimationActive={false}
                        connectNulls
                      />
                      <ReferenceLine 
                        x={maxSlopePoint.dist} 
                        stroke="#991b1b" 
                        strokeDasharray="3 3" 
                        strokeWidth={1}
                        label={{ 
                          value: 'MAX', 
                          position: 'top', 
                          fill: '#991b1b', 
                          fontSize: 8, 
                          fontWeight: 'black' 
                        }}
                      />
                      <YAxis hide domain={[minEle - 1, maxEle + 1]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-muted/10 flex items-center justify-between px-4 py-2 border-t border-border/30">
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
