'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import { useTheme } from 'next-themes';
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useMapLayers } from './route-map/use-map-layers';
import { MapMarkers } from './route-map/map-markers';
import { findNightPointIndex } from '@/lib/utils';
import { MapPopup } from './route-map/map-popup';
import { MapLegend } from './route-map/map-legend';
import { RouteLayers } from './route-map/route-layers';
import { LayerControl } from './route-map/layer-control';
import { useMapStyle, MapLayerType } from './route-map/use-map-style';
import { useMapView } from './route-map/use-map-view';
import { useMapTerrain } from './route-map/use-map-terrain';
import { RoutePlayer } from './route-map/route-player';
import { MapOverlayControls } from './route-map/map-overlay-controls';
import { useRouteStore } from '@/store/route-store';
import { findClosestPointIndex, projectOntoSegment } from '@/lib/geometry';

interface RouteMapProps {
  onResetToFullRouteView?: (func: () => void) => void;
}

export default function RouteMap({ onResetToFullRouteView }: RouteMapProps) {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const lastMapHoverRef = useRef<number>(0);

  // Read all state from the store
  const gpxData = useRouteStore((s) => s.gpxData);
  const weatherPoints = useRouteStore((s) => s.weatherPoints);
  const selectedPointIndex = useRouteStore((s) => s.selectedPointIndex);
  const exactSelectedPoint = useRouteStore((s) => s.exactSelectedPoint);
  const chartHoverPoint = useRouteStore((s) => s.chartHoverPoint);
  const activeFilter = useRouteStore((s) => s.activeFilter);
  const selectedRange = useRouteStore((s) => s.selectedRange);
  const activityType = useRouteStore((s) => s.fetchedActivityType);
  const showWaterSources = useRouteStore((s) => s.showWaterSources);
  const showNoCoverageZones = useRouteStore((s) => s.showNoCoverageZones);
  const focusPoint = useRouteStore((s) => s.focusPoint);
  const { setSelectedPointIndex, setExactSelectedPoint, clearSelection } = useRouteStore();

  const points = gpxData?.points || [];

  const nightPointIndex = useMemo(
    () => (weatherPoints.length > 0 ? findNightPointIndex(weatherPoints).index : null),
    [weatherPoints],
  );

  const noCoverageData = useMemo((): FeatureCollection | null => {
    if (!showNoCoverageZones || weatherPoints.length === 0) return null;
    const features: Feature<LineString>[] = [];
    let segment: [number, number][] = [];
    for (const wp of weatherPoints) {
      if (wp.mobileCoverage === 'none' || wp.mobileCoverage === 'low') {
        segment.push([wp.point.lon, wp.point.lat]);
      } else {
        if (segment.length >= 2) {
          features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: segment } });
        }
        segment = [];
      }
    }
    if (segment.length >= 2) {
      features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: segment } });
    }
    return features.length > 0 ? { type: 'FeatureCollection', features } : null;
  }, [showNoCoverageZones, weatherPoints]);

  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapType, setMapType] = useState<MapLayerType>('standard');
  const [isPlayerActive, setIsPlayerActive] = useState(false);

  const mapStyle = useMapStyle(mapType, resolvedTheme);
  const { syncTerrain } = useMapTerrain(mapRef, mapStyle);

  const { routeData, highlightedData, rangeHighlightData } = useMapLayers(
    points,
    weatherPoints.length > 0 ? weatherPoints : undefined,
    activeFilter,
    selectedRange,
  );

  const { resetToFullRouteView } = useMapView(mapRef, points, selectedRange);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onResetToFullRouteView) {
      onResetToFullRouteView(resetToFullRouteView);
    }
  }, [onResetToFullRouteView, resetToFullRouteView]);

  const handleStopPlayer = useCallback(() => {
    setIsPlayerActive(false);
    const map = mapRef.current?.getMap();
    if (map) {
      map.jumpTo({ pitch: 0, bearing: 0 });
    }
    resetToFullRouteView();
  }, [resetToFullRouteView]);

  const onMapLoad = useCallback(
    (event: any) => {
      syncTerrain();
      event.target.on('styledata', syncTerrain);
      resetToFullRouteView();
    },
    [syncTerrain, resetToFullRouteView],
  );

  const [manualPopupInfo, setManualPopupInfo] = useState<any>(null);

  const onMapClick = useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature) {
        setSelectedPointIndex(feature.properties.index);
        setManualPopupInfo(null); // Let the store selection handle it
        return;
      }

      const { lng, lat } = event.lngLat;
      if (points.length === 0) return;

      let minDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const d = (p.lon - lng) ** 2 + (p.lat - lat) ** 2;
        if (d < minDist) {
          minDist = d;
          closestIdx = i;
        }
      }

      const projectOntoSegment = (i: number) => {
        if (i < 0 || i >= points.length - 1) return null;
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.lon - p1.lon;
        const dy = p2.lat - p1.lat;
        const lenSq = dx * dx + dy * dy;
        const t =
          lenSq > 0
            ? Math.max(0, Math.min(1, ((lng - p1.lon) * dx + (lat - p1.lat) * dy) / lenSq))
            : 0;

        const distDiff = (p2.distanceFromStart - p1.distanceFromStart) * 1000;
        const eleDiff = (p2.ele || 0) - (p1.ele || 0);
        const slope = distDiff > 0.1 ? (eleDiff / distDiff) * 100 : 0;

        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const toDeg = (rad: number) => (rad * 180) / Math.PI;
        const lat1 = toRad(p1.lat);
        const lat2 = toRad(p2.lat);
        const dLon = toRad(p2.lon - p1.lon);
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x =
          Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

        return {
          point: {
            lat: p1.lat + t * dy,
            lon: p1.lon + t * dx,
            ele: (p1.ele || 0) + t * ((p2.ele || 0) - (p1.ele || 0)),
            distanceFromStart:
              p1.distanceFromStart + t * (p2.distanceFromStart - p1.distanceFromStart),
            estimatedTime:
              p1.estimatedTime && p2.estimatedTime
                ? new Date(
                    p1.estimatedTime.getTime() +
                      t * (p2.estimatedTime.getTime() - p1.estimatedTime.getTime()),
                  )
                : undefined,
            slope: slope,
          },
          bearing: bearing,
        };
      };

      const segBefore = projectOntoSegment(closestIdx - 1);
      const segAfter = projectOntoSegment(closestIdx);
      const interpolated = (segBefore ?? segAfter)?.point ?? points[closestIdx];

      const weatherIdx = Math.min(
        Math.floor(
          (interpolated.distanceFromStart / points[points.length - 1].distanceFromStart) *
            weatherPoints.length,
        ),
        weatherPoints.length - 1,
      );

      const weatherInfo = weatherPoints[weatherIdx] || {
        weather: { temperature: 0, weatherCode: 0, windSpeed: 0, time: new Date().toISOString() },
        windEffect: 'tailwind',
        solarIntensity: 'moderate',
      };

      // Clear selection first
      setSelectedPointIndex(null);

      setManualPopupInfo({
        point: interpolated,
        weather: weatherInfo.weather,
        index: -1, // Custom point
        bearing: (segBefore ?? segAfter)?.bearing || 0,
        windEffect: weatherInfo.windEffect,
        solarIntensity: weatherInfo.solarIntensity,
      });
    },
    [points, weatherPoints, setSelectedPointIndex],
  );

  const onMapMouseMove = useCallback(
    (e: any) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      const activeLayers = ['route-hover-target', 'highlight-line', 'range-line'].filter((id) =>
        map.getLayer(id),
      );

      if (activeLayers.length === 0) {
        setExactSelectedPoint(null);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: activeLayers });

      if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';

        const { lng, lat } = e.lngLat;

        if (points.length === 0) return;

        // 1. Find closest point index (O(n) pass)
        const closestIdx = findClosestPointIndex(points, lat, lng);

        // 2. Project mouse onto the two segments adjacent to closestIdx
        //    and pick the projection with smallest distance to mouse
        const segBefore = projectOntoSegment(points, closestIdx - 1, lat, lng);
        const segAfter = projectOntoSegment(points, closestIdx, lat, lng);

        let interpolated;
        if (segBefore && segAfter) {
          interpolated = segBefore.distSq <= segAfter.distSq ? segBefore.point : segAfter.point;
        } else {
          interpolated = (segBefore ?? segAfter)?.point ?? points[closestIdx];
        }

        setExactSelectedPoint(interpolated);
      } else {
        map.getCanvas().style.cursor = '';
        setExactSelectedPoint(null);
      }
    },
    [setExactSelectedPoint, points],
  );

  const onMapMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
    setExactSelectedPoint(null);
  }, [setExactSelectedPoint]);

  const popupInfo = useMemo(() => {
    const idx = hoveredPointIdx !== null ? hoveredPointIdx : selectedPointIndex;
    if (idx !== null && weatherPoints?.[idx]) return { ...weatherPoints[idx], index: idx };
    return null;
  }, [hoveredPointIdx, selectedPointIndex, weatherPoints]);

  useEffect(() => {
    if (focusPoint) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.flyTo({ center: [focusPoint.lon, focusPoint.lat], zoom: 14, duration: 2000 });
        if (focusPoint.silent) return;

        const weatherIdx = weatherPoints.findIndex(
          (wp) =>
            Math.abs(wp.point.lat - focusPoint.lat) < 0.0001 &&
            Math.abs(wp.point.lon - focusPoint.lon) < 0.0001,
        );

        if (weatherIdx !== -1) {
          const wp = weatherPoints[weatherIdx];

          let bearing = 0;
          if (weatherIdx < weatherPoints.length - 1) {
            const p1 = wp.point;
            const p2 = weatherPoints[weatherIdx + 1].point;
            const toRad = (deg: number) => (deg * Math.PI) / 180;
            const toDeg = (rad: number) => (rad * 180) / Math.PI;
            const lat1 = toRad(p1.lat);
            const lat2 = toRad(p2.lat);
            const dLon = toRad(p2.lon - p1.lon);
            const y = Math.sin(dLon) * Math.cos(lat2);
            const x =
              Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
            bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
          }

          let slope = 0;
          if (weatherIdx > 0) {
            const prev = weatherPoints[weatherIdx - 1];
            const distDiff = (wp.point.distanceFromStart - prev.point.distanceFromStart) * 1000;
            const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0);
            if (distDiff > 0.1) slope = (eleDiff / distDiff) * 100;
          }

          setManualPopupInfo({
            point: { ...wp.point, slope },
            weather: wp.weather,
            index: weatherIdx,
            bearing: bearing,
            windEffect: wp.windEffect,
            solarIntensity: wp.solarIntensity,
          });
          setHoveredPointIdx(null);
        }
      }
    }
  }, [focusPoint, weatherPoints]);

  const activePopupData = useMemo(() => {
    if (manualPopupInfo) return manualPopupInfo;
    return popupInfo;
  }, [manualPopupInfo, popupInfo]);

  const handleClosePopup = useCallback(() => {
    setManualPopupInfo(null);
    setHoveredPointIdx(null);
    setSelectedPointIndex(null);
  }, [setSelectedPointIndex]);

  const initialViewState = useMemo(() => {
    if (points && points.length > 0) {
      return { longitude: points[0].lon, latitude: points[0].lat, zoom: 10 };
    }
    return { longitude: -3.7038, latitude: 40.4168, zoom: 5 };
  }, [points]);

  if (!mounted) return null;

  return (
    <div className="border-border relative h-full w-full overflow-hidden border">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle as any}
        onClick={onMapClick}
        onLoad={onMapLoad}
        onMouseMove={onMapMouseMove}
        onMouseLeave={onMapMouseLeave}
        dragRotate={true}
        touchZoomRotate={true}
      >
        <NavigationControl position="bottom-right" />

        <RouteLayers
          mapType={mapType}
          routeData={routeData}
          highlightedData={highlightedData}
          rangeHighlightData={rangeHighlightData}
          activeFilter={activeFilter}
          selectedRange={selectedRange}
          noCoverageData={noCoverageData}
        />

        <MapMarkers
          points={points}
          weatherPoints={weatherPoints.length > 0 ? weatherPoints : undefined}
          selectedPointIndex={selectedPointIndex}
          fullSelectedPointIndex={null}
          exactSelectedPoint={chartHoverPoint || exactSelectedPoint}
          activeFilter={activeFilter}
          onPointSelect={setSelectedPointIndex}
          onHoverPoint={setHoveredPointIdx}
          activityType={activityType ?? undefined}
          showWaterSources={showWaterSources}
          focusPoint={focusPoint}
          nightPointIndex={nightPointIndex}
        />

        {activePopupData && (
          <MapPopup
            key={`popup-${activePopupData.index}-${activePopupData.point.lat}-${activePopupData.point.lon}`}
            popupInfo={activePopupData}
            onClose={handleClosePopup}
          />
        )}

        {isPlayerActive && (
          <RoutePlayer points={points} map={mapRef.current} onStop={handleStopPlayer} />
        )}
      </Map>

      <MapOverlayControls
        isPlayerActive={isPlayerActive}
        pointsCount={points.length}
        selectedRange={selectedRange}
        activeFilter={activeFilter}
        onStartPlayer={() => setIsPlayerActive(true)}
        onClearSelection={clearSelection}
      />

      <LayerControl mapType={mapType} setMapType={setMapType} />

      <style jsx global>{`
        .weather-popup .maplibregl-popup-content {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          color: var(--foreground) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
        }
      `}</style>

      {weatherPoints && weatherPoints.length > 0 && <MapLegend />}
    </div>
  );
}
