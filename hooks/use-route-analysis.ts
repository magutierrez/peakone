'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  parseGPX,
  sampleRoutePoints,
  calculateBearing,
  getWindEffect,
  reverseGPXData,
} from '@/lib/gpx-parser';
import type { GPXData, RouteConfig, RouteWeatherPoint, WeatherData } from '@/lib/types';
import { getSunPosition, getSolarExposure, getSolarIntensity } from '@/lib/utils';

export function useRouteAnalysis(config: RouteConfig) {
  const t = useTranslations('HomePage');
  const [gpxData, setGPXData] = useState<GPXData | null>(null);
  const [gpxFileName, setGPXFileName] = useState<string | null>(null);
  const [rawGPXContent, setRawGPXContent] = useState<string | null>(null);
  const [weatherPoints, setWeatherPoints] = useState<RouteWeatherPoint[]>([]);
  const [elevationData, setElevationData] = useState<{ distance: number; elevation: number }[]>([]);
  const [routeInfoData, setRouteInfoData] = useState<any[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRouteInfoLoading, setIsRouteInfoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gpxData) {
      const dense = sampleRoutePoints(gpxData.points, 300);
      setElevationData(
        dense.map((p) => ({
          distance: p.distanceFromStart,
          elevation: p.ele || 0,
        })),
      );
    } else {
      setElevationData([]);
    }
  }, [gpxData]);

  useEffect(() => {
    if (routeInfoData.length > 0 && elevationData.some((d) => d.elevation === 0)) {
      const newElevationData = routeInfoData.map((item) => ({
        distance: item.distanceFromStart,
        elevation: item.elevation || 0,
      }));
      setElevationData(newElevationData);
    }
  }, [routeInfoData]);

  const handleReverseRoute = useCallback(() => {
    if (!gpxData) return;
    const reversed = reverseGPXData(gpxData);
    setGPXData(reversed);
    setWeatherPoints([]);
    setSelectedPointIndex(null);
  }, [gpxData]);

  const handleStravaActivityLoaded = useCallback((data: GPXData, fileName: string) => {
    setGPXData(data);
    setGPXFileName(fileName);
    setRawGPXContent(JSON.stringify(data));
    setWeatherPoints([]);
    setSelectedPointIndex(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!gpxData) {
      setRouteInfoData([]);
      return;
    }

    const fetchRouteInfo = async () => {
      setIsRouteInfoLoading(true);
      try {
        const response = await fetch('/api/route-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: sampleRoutePoints(gpxData.points, 100).map((p) => ({
              lat: p.lat,
              lon: p.lon,
              distanceFromStart: p.distanceFromStart,
            })),
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setRouteInfoData(data.pathData || []);
        }
      } catch (e) {
        console.error('Failed to fetch route info', e);
      } finally {
        setIsRouteInfoLoading(false);
      }
    };

    fetchRouteInfo();
  }, [gpxData]);

  const handleGPXLoaded = useCallback(
    (content: string, fileName: string) => {
      try {
        const data = parseGPX(content);
        if (data.points.length < 2) {
          setError(t('errors.insufficientPoints'));
          return;
        }
        setGPXData(data);
        setGPXFileName(fileName);
        setRawGPXContent(content);
        setWeatherPoints([]);
        setSelectedPointIndex(null);
        setError(null);
      } catch {
        setError(t('errors.readError'));
      }
    },
    [t],
  );

  const handleClearGPX = useCallback(() => {
    setGPXData(null);
    setGPXFileName(null);
    setRawGPXContent(null);
    setWeatherPoints([]);
    setRouteInfoData([]);
    setSelectedPointIndex(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!gpxData) return;
    setIsLoading(true);
    setError(null);

    const fetchWithRetry = async (
      url: string,
      options: RequestInit,
      maxRetries = 3,
    ): Promise<Response> => {
      let lastError: Error | null = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(url, options);
          if (response.status === 429) {
            const waitTime = Math.pow(2, i) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
          return response;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          const waitTime = Math.pow(2, i) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
      throw lastError || new Error('Retry limit reached');
    };

    try {
      const sampled = sampleRoutePoints(gpxData.points, 24);
      const startTime = new Date(`${config.date}T${config.time}:00`);
      const pointsWithTime = sampled.map((point) => {
        const hoursElapsed = point.distanceFromStart / config.speed;
        return {
          ...point,
          estimatedTime: new Date(startTime.getTime() + hoursElapsed * 3600000),
        };
      });

      const response = await fetchWithRetry('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: pointsWithTime.map((p) => ({
            lat: p.lat,
            lon: p.lon,
            estimatedTime: p.estimatedTime.toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429 ? t('errors.tooManyRequests') : t('errors.weatherFetchError'),
        );
      }

      const weatherDataObj = await response.json();
      const weatherData: WeatherData[] = weatherDataObj.weather;

      const routeWeatherPoints: RouteWeatherPoint[] = pointsWithTime.map((point, idx) => {
        const nextIdx = Math.min(idx + 1, pointsWithTime.length - 1);
        const prevIdx = Math.max(0, idx - 1);
        const nextPoint = pointsWithTime[nextIdx];
        const prevPoint = pointsWithTime[prevIdx];
        
        const bearing = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon);
        const weather = weatherData[idx];
        const windResult = getWindEffect(bearing, weather.windDirection);

        // Match with route info (nearest point)
        const info = routeInfoData[idx] || {};
        const ele = point.ele || info.elevation || 0;

        // Calculate slope and aspect for hillshading
        // Use a window of points for a smoother slope
        const distDiff = (nextPoint.distanceFromStart - prevPoint.distanceFromStart) * 1000; // meters
        const eleDiff = (nextPoint.ele || info.elevation || 0) - (prevPoint.ele || info.elevation || 0);
        const slopeRad = distDiff > 0 ? Math.atan(eleDiff / distDiff) : 0;
        const slopeDeg = (slopeRad * 180) / Math.PI;
        
        // Aspect is the direction of the steepest descent
        // If going uphill, aspect is bearing + 180, if downhill, aspect is bearing
        const aspectDeg = eleDiff > 0 ? (bearing + 180) % 360 : bearing;

        const sunPos = getSunPosition(point.estimatedTime, point.lat, point.lon);
        const solarExposure = getSolarExposure(weather, sunPos, Math.abs(slopeDeg), aspectDeg);
        const solarIntensity = getSolarIntensity(weather.directRadiation, solarExposure);

        return {
          point: {
            ...point,
            ele,
          },
          weather,
          windEffect: windResult.effect,
          windEffectAngle: windResult.angle,
          bearing,
          pathType: info.pathType,
          surface: info.surface,
          solarExposure,
          solarIntensity,
          escapePoint: info.escapePoint,
          mobileCoverage: info.mobileCoverage,
        };
      });

      setWeatherPoints(routeWeatherPoints);
      setSelectedPointIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  }, [gpxData, config, t, routeInfoData]);

  return {
    gpxData,
    gpxFileName,
    rawGPXContent,
    weatherPoints,
    elevationData,
    routeInfoData,
    selectedPointIndex,
    setSelectedPointIndex,
    isLoading,
    isRouteInfoLoading,
    error,
    handleGPXLoaded,
    handleStravaActivityLoaded,
    handleClearGPX,
    handleReverseRoute,
    handleAnalyze,
  };
}
