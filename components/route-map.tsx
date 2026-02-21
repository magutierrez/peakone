'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Map, { NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
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

interface RouteMapProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex?: number | null;
  fullSelectedPointIndex?: number | null;
  exactSelectedPoint?: any | null;
  onHoverRoutePoint?: (point: any | null) => void;
  onPointSelect?: (index: number) => void;
  activeFilter?: { key: 'pathType' | 'surface' | 'hazard'; value: string } | null;
  selectedRange?: { start: number; end: number } | null;
  activityType?: 'cycling' | 'walking';
  onClearSelection?: () => void;
  showWaterSources?: boolean;
  onResetToFullRouteView?: (func: () => void) => void;
  focusPoint?: { lat: number; lon: number; name?: string } | null;
}

export default function RouteMap({
  points,
  weatherPoints,
  selectedPointIndex = null,
  fullSelectedPointIndex = null,
  exactSelectedPoint = null,
  onPointSelect,
  onHoverRoutePoint,
  activeFilter = null,
  selectedRange = null,
  activityType = 'cycling',
  onClearSelection,
  showWaterSources = false,
  onResetToFullRouteView,
  focusPoint = null,
}: RouteMapProps) {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef>(null);

  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapType, setMapType] = useState<MapLayerType>('standard');
  const [isPlayerActive, setIsPlayerActive] = useState(false);

  const mapStyle = useMapStyle(mapType, resolvedTheme);
  const { syncTerrain } = useMapTerrain(mapRef, mapStyle);

  const { routeData, highlightedData, rangeHighlightData } = useMapLayers(
    points,
    weatherPoints,
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
      // Fit bounds once the map is loaded to ensure it matches the route
      resetToFullRouteView();
    },
    [syncTerrain, resetToFullRouteView],
  );

  const onMapClick = useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature && onPointSelect) {
        onPointSelect(feature.properties.index);
      }
    },
    [onPointSelect],
  );

  const onMapMouseMove = useCallback(
    (e: any) => {
      const map = mapRef.current?.getMap();
      if (!map || !onHoverRoutePoint) return;

      const activeLayers = ['route-hover-target', 'highlight-line', 'range-line'].filter((id) =>
        map.getLayer(id),
      );

      if (activeLayers.length === 0) {
        onHoverRoutePoint(null);
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: activeLayers,
      });

      if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';

        // Find the closest point in our data
        const coords = e.lngLat;
        let minServiceDist = Infinity;
        let closestIdx = -1;

        // Optimization: only check points near the mouse
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const d = Math.pow(p.lon - coords.lng, 2) + Math.pow(p.lat - coords.lat, 2);
          if (d < minServiceDist) {
            minServiceDist = d;
            closestIdx = i;
          }
        }

        if (closestIdx !== -1) {
          onHoverRoutePoint(points[closestIdx]);
        }
      } else {
        map.getCanvas().style.cursor = '';
        onHoverRoutePoint(null);
      }
    },
    [onHoverRoutePoint, points],
  );

  const onMapMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
    if (onHoverRoutePoint) onHoverRoutePoint(null);
  }, [onHoverRoutePoint]);

  const popupInfo = useMemo(() => {
    const idx = hoveredPointIdx !== null ? hoveredPointIdx : selectedPointIndex;
    if (idx !== null && weatherPoints?.[idx]) return { ...weatherPoints[idx], index: idx };
    return null;
  }, [hoveredPointIdx, selectedPointIndex, weatherPoints]);

  useEffect(() => {
    if (focusPoint) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.flyTo({
          center: [focusPoint.lon, focusPoint.lat],
          zoom: 14,
          duration: 2000,
        });
      }
    }
  }, [focusPoint]);

  const initialViewState = useMemo(() => {
    if (points && points.length > 0) {
      return {
        longitude: points[0].lon,
        latitude: points[0].lat,
        zoom: 10,
      };
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
          weatherPoints={weatherPoints}
          selectedPointIndex={selectedPointIndex}
          fullSelectedPointIndex={fullSelectedPointIndex}
          exactSelectedPoint={exactSelectedPoint}
          activeFilter={activeFilter}
          onPointSelect={onPointSelect}
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
        onClearSelection={onClearSelection}
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
