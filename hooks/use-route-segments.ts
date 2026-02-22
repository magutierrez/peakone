'use client';

import { useMemo, useCallback } from 'react';
import { useRouteStore } from '@/store/route-store';

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

function getBreakdown(
  weatherPoints: ReturnType<typeof useRouteStore.getState>['weatherPoints'],
  key: 'pathType' | 'surface',
  colorMap: Record<string, string>,
) {
  const distances: Record<string, number> = {};
  let totalDist = 0;

  for (let i = 0; i < weatherPoints.length; i++) {
    const wp = weatherPoints[i];
    const val = wp[key] || 'unknown';
    const prevDist = i > 0 ? weatherPoints[i - 1].point.distanceFromStart : 0;
    const segmentDist = wp.point.distanceFromStart - prevDist;
    distances[val] = (distances[val] || 0) + segmentDist;
    totalDist += segmentDist;
  }

  return Object.entries(distances)
    .map(([name, dist]) => ({
      name,
      percent: totalDist > 0 ? (dist / totalDist) * 100 : 0,
      color: colorMap[name] || colorMap.unknown,
    }))
    .filter((item) => item.percent > 0.5)
    .sort((a, b) => b.percent - a.percent);
}

export function useRouteSegments() {
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const activeFilter = useRouteStore((s) => s.activeFilter);
  const setActiveFilter = useRouteStore((s) => s.setActiveFilter);
  const setSelectedRange = useRouteStore((s) => s.setSelectedRange);

  const pathBreakdown = useMemo(
    () => getBreakdown(weatherPoints, 'pathType', PATH_TYPE_COLORS),
    [weatherPoints],
  );

  const surfaceBreakdown = useMemo(
    () => getBreakdown(weatherPoints, 'surface', SURFACE_COLORS),
    [weatherPoints],
  );

  const handleSegmentClick = useCallback(
    (key: 'pathType' | 'surface', value: string) => {
      if (activeFilter?.key === key && activeFilter.value === value) {
        setActiveFilter(null);
        setSelectedRange(null);
      } else {
        setActiveFilter({ key, value });
        const matchingPoints = weatherPoints.filter((wp) => (wp[key] || 'unknown') === value);
        if (matchingPoints.length > 0) {
          const startDist = Math.min(...matchingPoints.map((p) => p.point.distanceFromStart));
          const endDist = Math.max(...matchingPoints.map((p) => p.point.distanceFromStart));
          setSelectedRange({ start: startDist, end: endDist });
        }
      }
    },
    [activeFilter, setActiveFilter, setSelectedRange, weatherPoints],
  );

  return { pathBreakdown, surfaceBreakdown, handleSegmentClick, activeFilter };
}
