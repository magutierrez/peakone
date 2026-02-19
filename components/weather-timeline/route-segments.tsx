'use client';

import { Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RouteWeatherPoint } from '@/lib/types';

interface RouteSegmentsProps {
  weatherPoints: RouteWeatherPoint[];
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  setActiveFilter?: (filter: { key: 'pathType' | 'surface'; value: string } | null) => void;
  onRangeSelect?: (range: { start: number; end: number } | null) => void;
}

const PATH_TYPE_COLORS: Record<string, string> = {
  cycleway: '#3ecf8e',
  path: '#10b981',
  footway: '#059669',
  pedestrian: '#059669',
  track: '#8b5cf6',
  residential: '#6b7280',
  living_street: '#9ca3af',
  primary: '#ef4444',
  primary_link: '#ef4444',
  trunk: '#b91c1c',
  secondary: '#f59e0b',
  secondary_link: '#f59e0b',
  tertiary: '#fbbf24',
  tertiary_link: '#fbbf24',
  service: '#d1d5db',
  unclassified: '#9ca3af',
  raceway: '#1e1b4b',
  unknown: '#e5e7eb',
};

const SURFACE_COLORS: Record<string, string> = {
  asphalt: '#4b5563',
  paved: '#6b7280',
  paving_stones: '#9ca3af',
  concrete: '#d1d5db',
  gravel: '#d97706',
  fine_gravel: '#f59e0b',
  unpaved: '#b45309',
  ground: '#78350f',
  compacted: '#92400e',
  dirt: '#a16207',
  sand: '#fcd34d',
  grass: '#10b981',
  unknown: '#e5e7eb',
};

export function RouteSegments({
  weatherPoints,
  activeFilter,
  setActiveFilter,
  onRangeSelect,
}: RouteSegmentsProps) {
  const t = useTranslations('WeatherTimeline');

  const totalPoints = weatherPoints.length;

  const getBreakdown = (key: 'pathType' | 'surface', colorMap: Record<string, string>) => {
    const counts: Record<string, number> = {};
    weatherPoints.forEach((wp) => {
      const val = wp[key] || 'unknown';
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        percent: (count / totalPoints) * 100,
        color: colorMap[name] || colorMap.unknown,
      }))
      .filter((item) => item.percent > 0)
      .sort((a, b) => b.percent - a.percent);
  };

  const handleSegmentClick = (key: 'pathType' | 'surface', value: string) => {
    if (activeFilter?.key === key && activeFilter.value === value) {
      setActiveFilter?.(null);
      onRangeSelect?.(null);
    } else {
      setActiveFilter?.({ key, value });

      // Find the distance range for this filter
      const matchingPoints = weatherPoints.filter((wp) => (wp[key] || 'unknown') === value);
      if (matchingPoints.length > 0) {
        const startDist = Math.min(...matchingPoints.map((p) => p.point.distanceFromStart));
        const endDist = Math.max(...matchingPoints.map((p) => p.point.distanceFromStart));
        onRangeSelect?.({ start: startDist, end: endDist });
      }
    }
  };

  const pathBreakdown = getBreakdown('pathType', PATH_TYPE_COLORS);
  const surfaceBreakdown = getBreakdown('surface', SURFACE_COLORS);

  const SegmentBar = ({
    title,
    data,
    translationNamespace,
    typeKey,
  }: {
    title: string;
    data: any[];
    translationNamespace: string;
    typeKey: 'pathType' | 'surface';
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">{title}</span>
      </div>
      <div className="bg-secondary ring-border flex h-3 w-full overflow-hidden rounded-full ring-1">
        {data.map((item, idx) => {
          const isActive = activeFilter?.key === typeKey && activeFilter.value === item.name;
          const isFilteringOther =
            activeFilter && (activeFilter.key !== typeKey || activeFilter.value !== item.name);

          return (
            <button
              key={idx}
              onClick={() => handleSegmentClick(typeKey, item.name)}
              style={{
                width: `${item.percent}%`,
                backgroundColor: item.color,
                opacity: isFilteringOther ? 0.3 : 1,
              }}
              className={`h-full transition-all hover:brightness-110 ${isActive ? 'ring-2 ring-white ring-inset' : ''}`}
              title={`${item.name}: ${item.percent.toFixed(0)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((item, idx) => {
          const isActive = activeFilter?.key === typeKey && activeFilter.value === item.name;
          return (
            <button
              key={idx}
              onClick={() => handleSegmentClick(typeKey, item.name)}
              className={`flex items-center gap-1.5 rounded border px-1.5 py-0.5 transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'bg-secondary/50 text-foreground hover:border-border border-transparent'
              }`}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-medium">
                {t(`${translationNamespace}.${item.name}` as any)}
              </span>
              <span className="text-muted-foreground text-[10px]">{item.percent.toFixed(0)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="mb-4 flex items-center gap-2">
        <MapIcon className="text-primary h-4 w-4" />
        <h3 className="text-foreground text-sm font-semibold">{t('segmentsTitle')}</h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SegmentBar
          title={t('pathTypes.title')}
          data={pathBreakdown}
          translationNamespace="pathTypes"
          typeKey="pathType"
        />
        <SegmentBar
          title={t('surfaces.title')}
          data={surfaceBreakdown}
          translationNamespace="surfaces"
          typeKey="surface"
        />
      </div>
    </div>
  );
}
