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
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatElevation, formatDistance } from '@/lib/utils';
import { useRouteStore } from '@/store/route-store';

export function AnalysisChart() {
  const t = useTranslations('WeatherTimeline');
  const { unitSystem } = useSettings();
  const isMobile = useIsMobile();
  const lastUpdateRef = useRef<number>(0);

  // Read all state from the store
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const allPoints = useRouteStore((s) => s.gpxData?.points || []);
  const elevationData = useRouteStore((s) => s.elevationData);
  // mapHoverPoint (exactSelectedPoint) → set by map hover, read by chart for reference line
  const mapHoverPoint = useRouteStore((s) => s.exactSelectedPoint);
  // chartHoverPoint → set by chart/hazard hover, shown as cursor dot on map
  const chartHoverPoint = useRouteStore((s) => s.chartHoverPoint);
  const setChartHoverPoint = useRouteStore((s) => s.setChartHoverPoint);
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);

  // The active cursor for this chart: chart hover takes priority, fallback to map hover
  const selectedPoint = chartHoverPoint ?? mapHoverPoint;

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
    const elevations = displayData.map((d) => d.elevation);
    return { min: Math.min(...elevations), max: Math.max(...elevations) };
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

  const gradientId = useMemo(
    () => `slope-${left}-${right}-${chartData.length}`,
    [left, right, chartData.length],
  );

  const gradientStops = useMemo(() => {
    if (!chartData.length) return [];

    const actualMin = chartData[0].distance;
    const actualMax = chartData[chartData.length - 1].distance;
    const domainMin = left === 'dataMin' ? actualMin : left;
    const domainMax = right === 'dataMax' ? actualMax : right;
    const domainRange = domainMax - domainMin;

    const stops: { offset: string; color: string }[] = [];
    const firstIndex = chartData.findIndex((d) => d.distance >= domainMin);
    const lastIndex = [...chartData].reverse().findIndex((d) => d.distance <= domainMax);
    const actualLastIndex = chartData.length - 1 - lastIndex;

    for (
      let i = Math.max(0, firstIndex - 1);
      i <= Math.min(chartData.length - 1, actualLastIndex + 1);
      i++
    ) {
      const d = chartData[i];
      const percentage = domainRange > 0 ? ((d.distance - domainMin) / domainRange) * 100 : 0;
      stops.push({
        offset: `${Math.max(0, Math.min(100, percentage))}%`,
        color: d.color || '#10b981',
      });
    }

    return stops.length
      ? stops
      : [
          { offset: '0%', color: '#10b981' },
          { offset: '100%', color: '#10b981' },
        ];
  }, [chartData, left, right]);

  const handleMouseMove = (e: any) => {
    if (e && e.chartX && e.viewBox && allPoints.length > 1 && chartData.length > 0) {
      const { x, width } = e.viewBox;
      const chartRatio = Math.max(0, Math.min(1, (e.chartX - x) / width));

      const actualMin = chartData[0].distance;
      const actualMax = chartData[chartData.length - 1].distance;
      const domainMin = left === 'dataMin' ? actualMin : left;
      const domainMax = right === 'dataMax' ? actualMax : right;
      const activeDistance = domainMin + chartRatio * (domainMax - domainMin);

      let p1 = allPoints[0];
      let p2 = allPoints[1];

      for (let i = 0; i < allPoints.length - 1; i++) {
        if (
          activeDistance >= allPoints[i].distanceFromStart &&
          activeDistance <= allPoints[i + 1].distanceFromStart
        ) {
          p1 = allPoints[i];
          p2 = allPoints[i + 1];
          break;
        }
      }

      const segmentDist = p2.distanceFromStart - p1.distanceFromStart;
      const ratio = segmentDist > 0 ? (activeDistance - p1.distanceFromStart) / segmentDist : 0;

      const interpolatedPoint = {
        lat: p1.lat + (p2.lat - p1.lat) * ratio,
        lon: p1.lon + (p2.lon - p1.lon) * ratio,
        ele: (p1.ele || 0) + ((p2.ele || 0) - (p1.ele || 0)) * ratio,
        distanceFromStart: activeDistance,
      };

      setChartHoverPoint(interpolatedPoint);
    }
    if (refAreaLeft !== null && e && e.activeLabel) setRefAreaRight(e.activeLabel);
  };

  const handleMouseLeave = () => {
    setChartHoverPoint(null);
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
      setSelectedRange({ start, end });
    }

    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const resetZoom = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setSelectedRange(null);
  };

  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm select-none md:p-6">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary/10 rounded-lg p-1.5 md:p-2">
            <TrendingUp className="text-primary h-3.5 w-3.5 md:h-4 md:w-4" />
          </div>
          <div>
            <h3 className="text-foreground text-xs leading-none font-bold md:text-sm">
              {t('elevationTitle')}
            </h3>
            {!isMobile && (
              <p className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-wider uppercase">
                {formatDistance(chartData[chartData.length - 1]?.distance || 0, unitSystem)}
              </p>
            )}
          </div>
          {(left !== 'dataMin' || right !== 'dataMax') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetZoom}
              className="h-6 gap-1 px-1.5 text-[9px] font-bold tracking-tight uppercase md:h-7 md:gap-1.5 md:px-2 md:text-[10px]"
            >
              <RefreshCcw className="h-2.5 w-2.5 md:h-3 md:w-3" />
              {t('chart.resetZoom')}
            </Button>
          )}
        </div>
        {selectedPoint && (
          <div className="bg-secondary/50 border-border/50 flex items-center gap-1.5 rounded-full border px-2 py-1 shadow-inner md:gap-2 md:px-3 md:py-1.5">
            <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full shadow-sm md:h-2 md:w-2" />
            <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
              {formatElevation(selectedPoint.ele || 0, unitSystem)}
            </span>
          </div>
        )}
      </div>

      <div className={`${isMobile ? 'h-32' : 'h-56'} mb-4 w-full cursor-crosshair md:mb-6`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseUp={zoom}
            onDoubleClick={resetZoom}
            margin={{ top: 5, right: isMobile ? 0 : 30, left: 0, bottom: 0 }}
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
            {!isMobile && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                opacity={0.1}
              />
            )}
            <XAxis
              dataKey="distance"
              type="number"
              domain={[left, right]}
              tick={
                isMobile
                  ? false
                  : { fontSize: 10, fill: 'currentColor', opacity: 0.6, fontWeight: 500 }
              }
              axisLine={isMobile ? false : { stroke: 'currentColor', opacity: 0.1 }}
              tickLine={false}
              tickFormatter={(val) => formatDistance(val, unitSystem)}
              minTickGap={40}
              allowDataOverflow
              hide={isMobile}
            />
            <YAxis
              type="number"
              domain={['auto', 'auto']}
              tick={
                isMobile
                  ? false
                  : { fontSize: 10, fill: 'currentColor', opacity: 0.6, fontWeight: 500 }
              }
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => formatElevation(val, unitSystem)}
              allowDataOverflow
              hide={isMobile}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const currentDist = data.distance;

                  const displayEle =
                    selectedPoint && Math.abs(selectedPoint.distanceFromStart - currentDist) < 0.05
                      ? selectedPoint.ele
                      : data.elevation;

                  return (
                    <div className="border-border bg-background/95 animate-in fade-in zoom-in flex items-center gap-3 rounded-xl border p-2 shadow-xl backdrop-blur-sm duration-200 md:gap-4 md:p-3">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-muted-foreground text-[8px] font-black tracking-widest uppercase md:text-[9px]">
                          {formatDistance(currentDist, unitSystem)}
                        </p>
                        <span className="text-foreground text-xs font-black md:text-sm">
                          {formatElevation(displayEle, unitSystem)}
                        </span>
                      </div>
                      <div className="border-border flex flex-col items-center gap-1 border-l pl-3 md:pl-4">
                        <span className="text-muted-foreground text-[7px] font-bold tracking-tighter uppercase md:text-[8px]">
                          {t('slope')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-1.5 w-1.5 rounded-full shadow-sm md:h-2 md:w-2"
                            style={{ backgroundColor: data.color }}
                          />
                          <span className="text-foreground font-mono text-[10px] font-black md:text-xs">
                            {data.slope}%
                          </span>
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
              strokeWidth={isMobile ? 2 : 3}
              fillOpacity={1}
              fill={`url(#${gradientId}-fill)`}
              isAnimationActive={false}
              connectNulls
            />

            {selectedPoint && (
              <ReferenceLine
                x={selectedPoint.distanceFromStart}
                stroke="hsl(var(--primary))"
                strokeWidth={isMobile ? 1 : 2}
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

      <div className="border-border/50 mt-2 grid grid-cols-2 gap-3 border-t pt-4 md:gap-4">
        <div className="bg-secondary/20 border-border/30 flex items-center gap-2 rounded-lg border px-1.5 py-1 md:gap-3 md:px-2 md:py-1.5">
          <div className="rounded-md bg-emerald-500/10 p-1 md:p-1.5">
            <ArrowUp className="h-3 w-3 text-emerald-600 md:h-3.5 md:w-3.5" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-[8px] leading-none font-black tracking-widest uppercase md:mb-1 md:text-[9px]">
              {t('chart.highestPoint')}
            </p>
            <p className="text-foreground text-xs leading-none font-black md:text-sm">
              {formatElevation(stats.max, unitSystem)}
            </p>
          </div>
        </div>
        <div className="bg-secondary/20 border-border/30 flex items-center gap-2 rounded-lg border px-1.5 py-1 md:gap-3 md:px-2 md:py-1.5">
          <div className="rounded-md bg-rose-500/10 p-1 md:p-1.5">
            <ArrowDown className="h-3 w-3 text-rose-600 md:h-3.5 md:w-3.5" />
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5 text-[8px] leading-none font-black tracking-widest uppercase md:mb-1 md:text-[9px]">
              {t('chart.lowestPoint')}
            </p>
            <p className="text-foreground text-xs leading-none font-black md:text-sm">
              {formatElevation(stats.min, unitSystem)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
