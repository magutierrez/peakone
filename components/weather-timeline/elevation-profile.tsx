'use client';

import { TrendingUp, RefreshCcw } from 'lucide-react';
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

interface ElevationProfileProps {
  weatherPoints: RouteWeatherPoint[];
  elevationData: { distance: number; elevation: number }[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
}

export function ElevationProfile({
  weatherPoints,
  elevationData,
  selectedIndex,
  onSelect,
  onRangeSelect,
}: ElevationProfileProps) {
  const t = useTranslations('WeatherTimeline');
  const lastUpdateRef = useRef<number>(0);

  const [refAreaLeft, setRefAreaLeft] = useState<any>(null);
  const [refAreaRight, setRefAreaRight] = useState<any>(null);
  const [left, setLeft] = useState<any>('dataMin');
  const [right, setRight] = useState<any>('dataMax');
  const [top, setTop] = useState<any>('dataMax');
  const [bottom, setBottom] = useState<any>('dataMin');

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

  const getSlopeColorHex = (slope: number) => {
    if (slope <= 1) return '#3ecf8e';
    if (slope < 5) return '#f59e0b';
    if (slope < 10) return '#ef4444';
    return '#991b1b';
  };

  const { chartData } = useMemo(() => {
    const data = displayData.map((d, idx) => {
      let slope = 0;
      if (idx > 0) {
        const prev = displayData[idx - 1];
        const distDiff = (d.distance - prev.distance) * 1000;
        const eleDiff = d.elevation - prev.elevation;
        if (distDiff > 0) {
          slope = (eleDiff / distDiff) * 100;
        }
      }

      return {
        ...d,
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

    const startIndex = Math.max(0, firstIndex - 1);
    const endIndex = Math.min(chartData.length - 1, actualLastIndex + 1);

    for (let i = startIndex; i <= endIndex; i++) {
      const d = chartData[i];
      const percentage = ((d.distance - domainMin) / domainRange) * 100;
      stops.push({
        offset: `${Math.max(0, Math.min(100, percentage))}%`,
        color: d.color,
      });
    }

    if (stops.length > 0) {
      if (parseFloat(stops[0].offset) > 0) {
        stops.unshift({ offset: '0%', color: stops[0].color });
      }
      if (parseFloat(stops[stops.length - 1].offset) < 100) {
        stops.push({ offset: '100%', color: stops[stops.length - 1].color });
      }
    }

    return stops;
  }, [chartData, left, right]);

  const handleMouseMove = (e: any) => {
    if (e && e.activePayload && e.activePayload[0]) {
      const activePoint = e.activePayload[0].payload;
      const now = Date.now();

      if (now - lastUpdateRef.current > 32 && weatherPoints.length > 0) {
        let closestIdx = 0;
        let minDiff = Infinity;

        weatherPoints.forEach((wp, idx) => {
          const diff = Math.abs(wp.point.distanceFromStart - activePoint.distance);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        onSelect(closestIdx);
        lastUpdateRef.current = now;
      }
    }
    if (refAreaLeft !== null && e) {
      setRefAreaRight(e.activeLabel);
    }
  };

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let [start, end] = [refAreaLeft, refAreaRight];
    if (start > end) [start, end] = [end, start];

    const filteredData = chartData.filter((d) => d.distance >= start && d.distance <= end);
    if (filteredData.length > 0) {
      const elevations = filteredData.map((d) => d.elevation);
      setLeft(start);
      setRight(end);
      setBottom(Math.min(...elevations) - 10);
      setTop(Math.max(...elevations) + 10);
      onRangeSelect?.({ start, end });
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const resetZoom = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setTop('dataMax');
    setBottom('dataMin');
    setRefAreaLeft(null);
    setRefAreaRight(null);
    onRangeSelect?.(null);
  };

  const selectedDataInChart =
    selectedIndex !== null && weatherPoints[selectedIndex]
      ? { distance: weatherPoints[selectedIndex].point.distanceFromStart }
      : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 select-none">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('elevationTitle')}</h3>
          {(left !== 'dataMin' || right !== 'dataMax') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetZoom}
              className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground bg-secondary/50"
            >
              <RefreshCcw className="h-3 w-3" />
              {t('chart.resetZoom')}
            </Button>
          )}
        </div>
        {selectedIndex !== null && weatherPoints[selectedIndex] && (
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  chartData.find(
                    (d) =>
                      Math.abs(d.distance - weatherPoints[selectedIndex].point.distanceFromStart) <
                      0.1,
                  )?.color || '#3ecf8e',
              }}
            />
            <span className="text-xs font-bold font-mono text-foreground">
              {Math.round(weatherPoints[selectedIndex].point.ele || 0)}m
            </span>
          </div>
        )}
      </div>

      <div className="h-48 w-full cursor-crosshair">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={handleMouseMove}
            onMouseUp={zoom}
            onDoubleClick={resetZoom}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, i) => (
                  <stop key={`line-${i}`} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
              <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="1" y2="0">
                {gradientStops.map((stop, i) => (
                  <stop key={`fill-${i}`} offset={stop.offset} stopColor={stop.color} stopOpacity={0.2} />
                ))}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="distance"
              type="number"
              domain={[left, right]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(val) => `${val.toFixed(1)} km`}
              minTickGap={30}
              allowDataOverflow
            />
            <YAxis
              type="number"
              domain={[bottom, top === 'dataMax' ? 'dataMax + 50' : top]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(val) => `${Math.round(val)}m`}
              allowDataOverflow
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-background p-2 shadow-md flex items-center gap-3">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                          km {data.distance.toFixed(1)}
                        </p>
                        <span className="text-sm font-bold text-foreground">{data.elevation}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 border-l border-border pl-3">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: data.color }}
                        />
                        <span className="text-xs font-bold font-mono text-foreground">
                          {data.slope}%
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId}-fill)`}
              isAnimationActive={false}
            />

            {selectedDataInChart && (
              <ReferenceLine
                x={selectedDataInChart.distance}
                stroke="hsl(var(--foreground))"
                strokeDasharray="3 3"
              />
            )}

            {refAreaLeft !== null && refAreaRight !== null && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}