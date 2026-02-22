import { useMemo } from 'react';
import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import type { Feature, FeatureCollection, LineString, MultiLineString, Point } from 'geojson';
import { getSlopeColorHex } from '@/lib/slope-colors';

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

export function useMapLayers(
  points: RoutePoint[],
  weatherPoints?: RouteWeatherPoint[],
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null,
  selectedRange?: { start: number; end: number } | null,
) {
  const routeData = useMemo<Feature<LineString> | null>(() => {
    if (points.length === 0) return null;
    const validPoints = points.filter(
      (p) =>
        typeof p.lon === 'number' && typeof p.lat === 'number' && !isNaN(p.lon) && !isNaN(p.lat),
    );
    if (validPoints.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: validPoints.map((p) => [p.lon, p.lat]),
      },
    };
  }, [points]);

  const highlightedData = useMemo<FeatureCollection<LineString> | null>(() => {
    if (!activeFilter || !weatherPoints || weatherPoints.length < 2 || points.length < 2) return null;
    
    const features: Feature<LineString>[] = [];

    if (activeFilter.key === 'hazard') {
      const [start, end] = activeFilter.value.split('-').map(Number);
      
      // For hazards, we create many small segments each with its own color based on slope
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        
        if (p1.distanceFromStart >= start && p2.distanceFromStart <= end) {
          const distDiffM = (p2.distanceFromStart - p1.distanceFromStart) * 1000;
          const eleDiffM = (p2.ele || 0) - (p1.ele || 0);
          const slope = distDiffM > 0.1 ? (eleDiffM / distDiffM) * 100 : 0;
          
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[p1.lon, p1.lat], [p2.lon, p2.lat]]
            },
            properties: {
              color: getSlopeColorHex(slope)
            }
          });
        }
      }
    } else {
      // Logic for pathType and surface (Solid color)
      let currentSegment: number[][] = [];
      points.forEach((p, i) => {
        let matchingWp = weatherPoints[0];
        for (let j = 0; j < weatherPoints.length; j++) {
          if (p.distanceFromStart <= weatherPoints[j].point.distanceFromStart) {
            matchingWp = weatherPoints[j];
            break;
          }
          if (j === weatherPoints.length - 1) matchingWp = weatherPoints[j];
        }

        const currentFilterValue = matchingWp[activeFilter.key as 'pathType' | 'surface'] || 'unknown';
        const colorMap = activeFilter.key === 'pathType' ? PATH_TYPE_COLORS : SURFACE_COLORS;
        const color = colorMap[currentFilterValue] || colorMap.unknown;

        if (currentFilterValue === activeFilter.value) {
          currentSegment.push([p.lon, p.lat]);
        } else {
          if (currentSegment.length > 1) {
            features.push({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: currentSegment },
              properties: { color }
            });
          }
          currentSegment = [];
        }
      });
      if (currentSegment.length > 1) {
        const colorMap = activeFilter.key === 'pathType' ? PATH_TYPE_COLORS : SURFACE_COLORS;
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: currentSegment },
          properties: { color: colorMap[activeFilter.value] || colorMap.unknown }
        });
      }
    }

    return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [activeFilter, weatherPoints, points]);

  const rangeHighlightData = useMemo<Feature<LineString> | null>(() => {
    if (!selectedRange || points.length < 2) return null;

    const rangePoints = points.filter(
      (p) =>
        typeof p.lon === 'number' &&
        typeof p.lat === 'number' &&
        !isNaN(p.lon) &&
        !isNaN(p.lat) &&
        p.distanceFromStart >= selectedRange.start &&
        p.distanceFromStart <= selectedRange.end,
    );

    if (rangePoints.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: rangePoints.map((p) => [p.lon, p.lat]),
      },
    };
  }, [selectedRange, points]);

  const weatherPointsData = useMemo<FeatureCollection<Point> | null>(() => {
    if (!weatherPoints || weatherPoints.length === 0) return null;

    const validWeatherPoints = weatherPoints.filter(
      (wp) =>
        wp.point &&
        typeof wp.point.lon === 'number' &&
        typeof wp.point.lat === 'number' &&
        !isNaN(wp.point.lon) &&
        !isNaN(wp.point.lat),
    );

    if (validWeatherPoints.length === 0) return null;

    return {
      type: 'FeatureCollection',
      features: validWeatherPoints.map((wp, idx) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [wp.point.lon, wp.point.lat] },
        properties: {
          index: idx,
          bearing: typeof wp.weather.windDirection === 'number' ? wp.weather.windDirection : 0,
          effect: wp.windEffect,
          pathType: wp.pathType || 'unknown',
          surface: wp.surface || 'unknown',
          distanceFromStart: wp.point.distanceFromStart,
        },
      })),
    };
  }, [weatherPoints]);

  const markerData = useMemo<FeatureCollection<Point> | null>(() => {
    if (points.length < 2) return null;

    const start = points[0];
    const end = points[points.length - 1];

    const features: Feature<Point>[] = [];

    if (
      typeof start.lon === 'number' &&
      typeof start.lat === 'number' &&
      !isNaN(start.lon) &&
      !isNaN(start.lat)
    ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [start.lon, start.lat] },
        properties: { label: 'A', type: 'start' },
      });
    }

    if (
      typeof end.lon === 'number' &&
      typeof end.lat === 'number' &&
      !isNaN(end.lon) &&
      !isNaN(end.lat)
    ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [end.lon, end.lat] },
        properties: { label: 'B', type: 'end' },
      });
    }

    return { type: 'FeatureCollection', features };
  }, [points]);

  return { routeData, highlightedData, rangeHighlightData, weatherPointsData, markerData };
}
