'use client';

import { TrendingUp, RefreshCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { RouteWeatherPoint } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { formatElevation, formatDistance } from '@/lib/utils';

interface AnalysisChartProps {
  weatherPoints: RouteWeatherPoint[];
  allPoints: any[];
  elevationData: { distance: number; elevation: number }[];
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
  activeFilter?: any;
}

export function AnalysisChart({
  weatherPoints,
  allPoints = [],
  elevationData,
  selectedIndex,
  onSelect,
  onRangeSelect,
}: AnalysisChartProps) {
  const t = useTranslations('WeatherTimeline');
  const { unitSystem } = useSettings();
  const lastUpdateRef = useRef<number>(0);

  const [refAreaLeft, setRefAreaLeft] = useState<any>(null);
  const [refAreaRight, setRefAreaRight] = useState<any>(null);
  const [left, setLeft] = useState<any>('dataMin');
  const [right, setRight] = useState<any>('dataMax');

  const displayData = useMemo(() => {
    const rawData =
      elevationData && elevationData.length > 0
        ? elevationData
        : weatherPoints.map((wp) => ({
            distance: wp.point.distanceFromStart,
            elevation: wp.point.ele || 0,
          }));

    return rawData.map((d) => ({
      ...d,
      elevation: Math.round(d.elevation),
    }));
  }, [elevationData, weatherPoints]);

  const stats = useMemo(() => {
    if (!displayData.length) return { min: 0, max: 0 };
    const elevations = displayData.map(d => d.elevation);
    return {
      min: Math.min(...elevations),
      max: Math.max(...elevations)
    };
  }, [displayData]);

  const getSlopeColorHex = (slope: number) => {
    const absSlope = Math.abs(slope);
    if (absSlope <= 1) return '#10b981';
    if (absSlope < 5) return '#f59e0b';
    if (absSlope < 10) return '#ef4444';
    return '#991b1b';
  };

  const { chartData } = useMemo(() => {
    const data = displayData.map((d, idx) => {
      let slope = 0;
      if (idx > 0) {
        const prev = displayData[idx - 1];
        const distDiff = (d.distance - prev.distance) * 1000;
        const eleDiff = d.elevation - prev.elevation;
        if (distDiff > 0.1) {
          slope = (eleDiff / distDiff) * 100;
        }
      }

      return {
        ...d,
        elevation: isNaN(d.elevation) ? 0 : d.elevation,
        slope: Math.round(slope * 10) / 10,
        color: getSlopeColorHex(slope),
      };
    });
    return { chartData: data };
  }, [displayData]);

  const gradientId = useMemo(() => `slope-${left}-${right}-${chartData.length}`, [left, right, chartData.length]);

  const gradientStops = useMemo(() => {
    if (!chartData.length) return [];
    
    const actualMin = chartData[0].distance;
    const actualMax = chartData[chartData.length - 1].distance;
    const domainMin = left === 'dataMin' ? actualMin : left;
    const domainMax = right === 'dataMax' ? actualMax : right;
    const domainRange = domainMax - domainMin;

    const stops: { offset: string; color: string }[] = [];
    const firstIndex = chartData.findIndex(d => d.distance >= domainMin);
    const lastIndex = [...chartData].reverse().findIndex(d => d.distance <= domainMax);
    const actualLastIndex = chartData.length - 1 - lastIndex;

    for (let i = Math.max(0, firstIndex - 1); i <= Math.min(chartData.length - 1, actualLastIndex + 1); i++) {
      const d = chartData[i];
      const percentage = domainRange > 0 ? ((d.distance - domainMin) / domainRange) * 100 : 0;
      stops.push({
        offset: `${Math.max(0, Math.min(100, percentage))}%`,
        color: d.color || '#10b981',
      });
    }

    return stops.length ? stops : [{ offset: '0%', color: '#10b981' }, { offset: '100%', color: '#10b981' }];
  }, [chartData, left, right]);

  const handleMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload[0]) {
      const activePoint = e.activePayload[0].payload;
      const now = Date.now();

      if (now - lastUpdateRef.current > 16 && allPoints.length > 0) {
        let closestIdx = 0;
        let minDiff = Infinity;

        for (let i = 0; i < allPoints.length; i++) {
          const diff = Math.abs(allPoints[i].distanceFromStart - activePoint.distance);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          } else if (diff > minDiff) {
            break;
          }
        }

        onSelect(closestIdx);
        lastUpdateRef.current = now;
      }
    }
    if (refAreaLeft !== null && e) setRefAreaRight(e.activeLabel);
  };

  const handleMouseLeave = () => {
    onSelect(null);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight || !refAreaLeft) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let [start, end] = [refAreaLeft, refAreaRight];
    if (start > end) [start, end] = [end, start];

    const filteredData = chartData.filter((d) => d.distance >= start && d.distance <= end);
    if (filteredData.length > 0) {
      setLeft(start);
      setRight(end);
      onRangeSelect?.({ start, end });
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const resetZoom = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft(null);
    setRefAreaRight(null);
    onRangeSelect?.(null);
  };

  const selectedDataInChart =
    selectedIndex !== null && allPoints[selectedIndex]
      ? { distance: allPoints[selectedIndex].distanceFromStart }
      : null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 select-none shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">{t('elevationTitle')}</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold tracking-wider">
              {formatDistance(chartData[chartData.length-1]?.distance || 0, unitSystem)}
            </p>
          </div>
          {(left !== 'dataMin' || right !== 'dataMax') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetZoom}
              className="h-7 gap-1.5 px-2 text-[10px] font-bold uppercase tracking-tight"
            >
              <RefreshCcw className="h-3 w-3" />
              {t('chart.resetZoom')}
            </Button>
          )}
        </div>
        {selectedIndex !== null && allPoints[selectedIndex] && (
          <div className="bg-secondary/50 px-3 py-1.5 rounded-full border border-border/50 flex items-center gap-2 shadow-inner">
            <div
              className="h-2 w-2 rounded-full shadow-sm bg-primary animate-pulse"
            />
            <span className="text-xs font-black font-mono text-foreground">
              {formatElevation(allPoints[selectedIndex].ele || 0, unitSystem)}
            </span>
          </div>
        )}
      </div>

      <div className="h-56 w-full cursor-crosshair mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseUp={zoom}
            onDoubleClick={resetZoom}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, i) => (
                  <stop key={`line-${i}`} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
            <XAxis
              dataKey="distance"
              type="number"
              domain={[left, right]}
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6, fontWeight: 500 }}
              axisLine={{ stroke: 'currentColor', opacity: 0.1 }}
              tickLine={false}
              tickFormatter={(val) => formatDistance(val, unitSystem)}
              minTickGap={40}
              allowDataOverflow
            />
            <YAxis
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => formatElevation(val, unitSystem)}
              allowDataOverflow
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm p-3 shadow-xl flex items-center gap-4 animate-in fade-in zoom-in duration-200">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          {formatDistance(data.distance, unitSystem)}
                        </p>
                        <span className="text-sm font-black text-foreground">
                          {formatElevation(data.elevation, unitSystem)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center border-l border-border pl-4 gap-1">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">{t('slope')}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: data.color }} />
                          <span className="text-xs font-black font-mono text-foreground">{data.slope}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="linear"
              dataKey="elevation"
              stroke={gradientStops.length > 0 ? `url(#${gradientId})` : '#10b981'}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId}-fill)`}
              isAnimationActive={false}
              connectNulls
            />

            {selectedDataInChart && (
              <ReferenceLine
                x={selectedDataInChart.distance}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}

            {refAreaLeft !== null && refAreaRight !== null && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                fill="hsl(var(--primary))"
                fillOpacity={0.05}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-secondary/20 border border-border/30">
          <div className="p-1.5 bg-emerald-500/10 rounded-md">
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
              {t('chart.highestPoint')}
            </p>
            <p className="text-sm font-black text-foreground leading-none">
              {formatElevation(stats.max, unitSystem)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-secondary/20 border border-border/30">
          <div className="p-1.5 bg-rose-500/10 rounded-md">
            <ArrowDown className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
              {t('chart.lowestPoint')}
            </p>
            <p className="text-sm font-black text-foreground leading-none">
              {formatElevation(stats.min, unitSystem)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
