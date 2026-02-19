'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  parseGPX,
  sampleRoutePoints,
  calculateBearing,
  getWindEffect,
  reverseGPXData,
  stravaToGPXData,
} from '@/lib/gpx-parser';
import type { GPXData, RouteConfig, RouteWeatherPoint, WeatherData } from '@/lib/types';
import {
  getSunPosition,
  getSolarExposure,
  getSolarIntensity,
  calculateSmartSpeed,
  calculateElevationGainLoss,
} from '@/lib/utils';

export interface UseRouteAnalysisConfig {
  date: string;
  time: string;
  speed: number;
  activityType: 'cycling' | 'walking';
}

export function useRouteAnalysis(
  config: UseRouteAnalysisConfig,
  initialRawGpxContent: string | null,
  initialGpxFileName: string | null,
  initialData?: {
    distance: number;
    elevationGain: number;
    elevationLoss: number;
  },
) {
  const t = useTranslations('HomePage');
  const [gpxData, setGPXData] = useState<GPXData | null>(null);
  const [gpxFileName, setGPXFileName] = useState<string | null>(null);
  const [rawGPXContent, setRawGPXContent] = useState<string | null>(null);
  const [weatherPoints, setWeatherPoints] = useState<RouteWeatherPoint[]>([]);
  const [elevationData, setElevationData] = useState<{ distance: number; elevation: number }[]>([]);
  const [routeInfoData, setRouteInfoData] = useState<any[]>([]); // Terrain, surface, etc.
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For analyze button
  const [isRouteInfoLoading, setIsRouteInfoLoading] = useState(false); // For initial route data
  const [error, setError] = useState<string | null>(null);
  const [recalculatedElevationGain, setRecalculatedElevationGain] = useState(initialData?.elevationGain || 0);
  const [recalculatedElevationLoss, setRecalculatedElevationLoss] = useState(initialData?.elevationLoss || 0);
  const [recalculatedTotalDistance, setRecalculatedTotalDistance] = useState(initialData?.distance || 0);
  const [isWeatherAnalyzed, setIsWeatherAnalyzed] = useState(false); // New state
  const [bestWindows, setBestWindows] = useState<any[]>([]);
  const [isFindingWindow, setIsFindingWindow] = useState(false);

  // Effect to initialize GPX data from props received from setup page
  useEffect(() => {
    // Only process if initial content is provided and gpxData hasn't been set yet
    if (initialRawGpxContent && initialGpxFileName && !gpxData) {
      try {
        let data: GPXData;
        if (initialRawGpxContent.startsWith('{')) {
          const jsonData = JSON.parse(initialRawGpxContent);
          if (jsonData.points && jsonData.totalDistance !== undefined) {
            // It's already in GPXData format
            data = jsonData;
          } else {
            // It's a Strava API response
            data = stravaToGPXData(jsonData);
          }
        } else {
          // Assume it's GPX XML content
          data = parseGPX(initialRawGpxContent);
        }

        if (data.points.length < 2) {
          setError(t('errors.insufficientPoints'));
          return;
        }
        setGPXData(data);
        setGPXFileName(initialGpxFileName);
        setRawGPXContent(initialRawGpxContent);
        
        // Use provided initial data or fallback to parsed data
        setRecalculatedTotalDistance(initialData?.distance || data.totalDistance);
        setRecalculatedElevationGain(initialData?.elevationGain || data.totalElevationGain);
        setRecalculatedElevationLoss(initialData?.elevationLoss || data.totalElevationLoss);
        
        setError(null);
        setIsWeatherAnalyzed(false); // Reset weather analysis status
      } catch (err) {
        setError(t('errors.readError'));
      }
    }
  }, [initialRawGpxContent, initialGpxFileName, gpxData, t, initialData]);

  // Effect to update initial elevation data when gpxData changes
  useEffect(() => {
    if (gpxData) {
      const dense = sampleRoutePoints(gpxData.points, 3000);
      const initialElevation = dense.map((p) => ({
        distance: p.distanceFromStart,
        elevation: p.ele || 0,
      }));

      // Always set initial elevation to prepare the chart
      setElevationData(initialElevation);
      // Also fetch route info (terrain, etc.) immediately when GPX data is available
      // The old handleGPXLoaded also triggered routeInfoData fetch.
      fetchRouteInfo();
    } else {
      setElevationData([]);
      setRecalculatedElevationGain(0);
      setRecalculatedElevationLoss(0);
      setRecalculatedTotalDistance(0);
      setRouteInfoData([]);
      setWeatherPoints([]);
      setIsWeatherAnalyzed(false);
    }
  }, [gpxData]);

  // Effect to update elevation data with richer info from API (routeInfoData)
  useEffect(() => {
    if (routeInfoData.length > 0) {
      const newElevationData = routeInfoData.map((item) => ({
        distance: item.distanceFromStart,
        elevation: item.elevation || 0,
      }));
      setElevationData(newElevationData);
    }
  }, [routeInfoData]);

  // Effect to recalculate elevation gain/loss/distance when elevationData changes
  useEffect(() => {
    if (elevationData.length > 0) {
      const { totalElevationGain, totalElevationLoss } = calculateElevationGainLoss(elevationData);
      setRecalculatedElevationGain(totalElevationGain);
      setRecalculatedElevationLoss(totalElevationLoss);
      const calculatedDistance = elevationData[elevationData.length - 1].distance;
      setRecalculatedTotalDistance(calculatedDistance);
    }
  }, [elevationData]);

  const handleReverseRoute = useCallback(() => {
    if (!gpxData) return;
    const reversed = reverseGPXData(gpxData);
    setGPXData(reversed);
    setRecalculatedElevationGain(reversed.totalElevationGain);
    setRecalculatedElevationLoss(reversed.totalElevationLoss);
    setRecalculatedTotalDistance(reversed.totalDistance);
    setWeatherPoints([]);
    setSelectedPointIndex(null);
    setIsWeatherAnalyzed(false); // Reset weather analysis status
  }, [gpxData]);

  const fetchRouteInfo = useCallback(async () => {
    if (!gpxData) {
      setRouteInfoData([]);
      return;
    }

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
      setError(t('errors.unknownError'));
    } finally {
      setIsRouteInfoLoading(false);
    }
  }, [gpxData, t]);

  // Run fetchRouteInfo when gpxData is set/changes
  useEffect(() => {
    if (gpxData) {
      fetchRouteInfo();
    }
  }, [gpxData, fetchRouteInfo]);


  const handleClearGPX = useCallback(() => {
    setGPXData(null);
    setGPXFileName(null);
    setRawGPXContent(null);
    setWeatherPoints([]);
    setRouteInfoData([]);
    setSelectedPointIndex(null);
    setError(null);
    setIsWeatherAnalyzed(false); // Reset weather analysis status
  }, []);

  const handleAnalyze = useCallback(async (params?: UseRouteAnalysisConfig | React.MouseEvent | any) => {
    if (!gpxData) return;
    
    // Safety check: React events might be passed if called directly from onClick
    const hasOverride = params && typeof params === 'object' && 'date' in params && 'time' in params;
    const analysisConfig = hasOverride ? params : config;

    setIsLoading(true);
    setError(null);
    setWeatherPoints([]); // Clear previous weather points
    setIsWeatherAnalyzed(false);

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
      const sampled = sampleRoutePoints(gpxData.points, 48);
      const startTime = new Date(`${analysisConfig.date}T${analysisConfig.time}:00`);

      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start time configuration');
      }

      // Calculate times point-to-point with smart speed
      const pointsWithTime: any[] = [];
      let currentElapsedTime = 0;

      sampled.forEach((point, idx) => {
        if (idx === 0) {
          pointsWithTime.push({
            ...point,
            estimatedTime: new Date(startTime.getTime()),
          });
        } else {
          const prevPoint = sampled[idx - 1];
          const segmentDist = point.distanceFromStart - prevPoint.distanceFromStart;
          const segmentEleGain = Math.max(0, (point.ele || 0) - (prevPoint.ele || 0));

          const speedAtSegment = calculateSmartSpeed(
            analysisConfig.speed,
            segmentDist,
            segmentEleGain,
            analysisConfig.activityType,
          );

          const segmentTimeHours = segmentDist / speedAtSegment;
          currentElapsedTime += segmentTimeHours;

          pointsWithTime.push({
            ...point,
            estimatedTime: new Date(startTime.getTime() + currentElapsedTime * 3600000),
          });
        }
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

        // Find closest info by distance (not index) to be robust
        const info = routeInfoData.reduce(
          (prev, curr) =>
            Math.abs(curr.distanceFromStart - point.distanceFromStart) <
            Math.abs(prev.distanceFromStart - point.distanceFromStart)
              ? curr
              : prev,
          routeInfoData[0] || {},
        );

        const ele = point.ele !== undefined && point.ele !== 0 ? point.ele : info.elevation || 0;

        // Calculate slope and aspect for hillshading
        const distDiff = (nextPoint.distanceFromStart - prevPoint.distanceFromStart) * 1000; // meters
        const eleDiff =
          (nextPoint.ele !== undefined
            ? nextPoint.ele
            : routeInfoData.find((d: any) => d.distanceFromStart === nextPoint.distanceFromStart)
                ?.elevation || 0) -
          (prevPoint.ele !== undefined
            ? prevPoint.ele
            : routeInfoData.find((d: any) => d.distanceFromStart === prevPoint.distanceFromStart)
                ?.elevation || 0);
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
          waterSources: info.waterSources,
        };
      });

      setWeatherPoints(routeWeatherPoints);
      setSelectedPointIndex(0);
      setIsWeatherAnalyzed(true); // Mark weather as analyzed
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  }, [gpxData, config, t, routeInfoData]);

  const handleFindBestWindow = useCallback(async () => {
    if (!gpxData) return;
    setIsFindingWindow(true);
    setBestWindows([]);

    try {
      // Pick 3 points: start, mid, end
      const startPoint = gpxData.points[0];
      const midPoint = gpxData.points[Math.floor(gpxData.points.length / 2)];
      const endPoint = gpxData.points[gpxData.points.length - 1];

      // Estimate bearings for mid points
      const calculateApproxBearing = (idx: number) => {
        const p1 = gpxData.points[idx];
        const p2 = gpxData.points[Math.min(idx + 10, gpxData.points.length - 1)];
        return calculateBearing(p1.lat, p1.lon, p2.lat, p2.lon);
      };

      const keyPoints = [
        { ...startPoint, bearing: calculateApproxBearing(0) },
        { ...midPoint, bearing: calculateApproxBearing(Math.floor(gpxData.points.length / 2)) },
        { ...endPoint, bearing: calculateApproxBearing(gpxData.points.length - 1) }
      ];

      const response = await fetch('/api/weather/best-window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyPoints,
          activityType: config.activityType,
          baseSpeed: config.speed,
          startTime: `${config.date}T${config.time}:00`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBestWindows(data.windows || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setIsFindingWindow(false);
    }
  }, [gpxData, config]);

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
    handleClearGPX,
    handleReverseRoute,
    handleAnalyze,
    handleFindBestWindow,
    bestWindows,
    isFindingWindow,
    recalculatedElevationGain,
    recalculatedElevationLoss,
    recalculatedTotalDistance,
    isWeatherAnalyzed, // Export new state
  };
}
