'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useMapLayers } from './route-map/use-map-layers';
import { MapMarkers } from './route-map/map-markers';
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
  const focusPoint = useRouteStore((s) => s.focusPoint);
  const { setSelectedPointIndex, setExactSelectedPoint, clearSelection } = useRouteStore();

  const points = gpxData?.points || [];

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

  const onMapClick = useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature) {
        setSelectedPointIndex(feature.properties.index);
      }
    },
    [setSelectedPointIndex],
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

        // 2. Project mouse onto the two segments adjacent to closestIdx
        //    and pick the projection with smallest distance to mouse
        const projectOntoSegment = (i: number) => {
          if (i < 0 || i >= points.length - 1) return null;
          const p1 = points[i];
          const p2 = points[i + 1];
          const dx = p2.lon - p1.lon;
          const dy = p2.lat - p1.lat;
          const lenSq = dx * dx + dy * dy;
          const t = lenSq > 0
            ? Math.max(0, Math.min(1, ((lng - p1.lon) * dx + (lat - p1.lat) * dy) / lenSq))
            : 0;
          const projLon = p1.lon + t * dx;
          const projLat = p1.lat + t * dy;
          return {
            t,
            distSq: (lng - projLon) ** 2 + (lat - projLat) ** 2,
            point: {
              lat: projLat,
              lon: projLon,
              ele: (p1.ele || 0) + t * ((p2.ele || 0) - (p1.ele || 0)),
              distanceFromStart:
                p1.distanceFromStart + t * (p2.distanceFromStart - p1.distanceFromStart),
            },
          };
        };

        const segBefore = projectOntoSegment(closestIdx - 1);
        const segAfter = projectOntoSegment(closestIdx);

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
      }
    }
  }, [focusPoint]);

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
          activityType={activityType}
          showWaterSources={showWaterSources}
          focusPoint={focusPoint}
        />

        {popupInfo && <MapPopup popupInfo={popupInfo} onClose={() => setHoveredPointIdx(null)} />}

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
