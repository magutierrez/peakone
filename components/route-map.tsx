'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Map, { NavigationControl, MapRef, Source, Layer } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslations } from 'next-intl';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import { useMapLayers } from './route-map/use-map-layers';
import { MapMarkers } from './route-map/map-markers';
import { MapPopup } from './route-map/map-popup';
import { MapLegend } from './route-map/map-legend';
import { RouteLayers } from './route-map/route-layers';
import { LayerControl } from './route-map/layer-control';
import { useMapStyle, MapLayerType } from './route-map/use-map-style';
import { useMapView } from './route-map/use-map-view';
import { RoutePlayer } from './route-map/route-player';
import { Box } from 'lucide-react';

interface RouteMapProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex?: number | null;
  fullSelectedPointIndex?: number | null;
  exactSelectedPoint?: any | null; // New prop for ultra-precise sync
  onPointSelect?: (index: number) => void;
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  selectedRange?: { start: number; end: number } | null;
  activityType?: 'cycling' | 'walking';
  onClearSelection?: () => void;
  showWaterSources?: boolean;
  onResetToFullRouteView?: (func: () => void) => void; // Corrected type
}

export default function RouteMap({
  points,
  weatherPoints,
  selectedPointIndex = null,
  fullSelectedPointIndex = null,
  exactSelectedPoint = null,
  onPointSelect,
  activeFilter = null,
  selectedRange = null,
  activityType = 'cycling',
  onClearSelection,
  showWaterSources = false,
  onResetToFullRouteView, // New prop
}: RouteMapProps) {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef>(null);
  const t = useTranslations('RouteMap');

  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapType, setMapType] = useState<MapLayerType>('standard');
  const [isPlayerActive, setIsPlayerActive] = useState(false);

  const mapStyle = useMapStyle(mapType, resolvedTheme);

  const { routeData, highlightedData, rangeHighlightData } = useMapLayers(
    points,
    weatherPoints,
    activeFilter,
    selectedRange,
  );

  const { resetToFullRouteView } = useMapView(mapRef, points, selectedRange);

  useEffect(() => {
    if (onResetToFullRouteView) {
      // This is a bit of a hack to pass a function back up to a parent
      // without directly passing a setter. It effectively makes onResetToFullRouteView callable.
      // A more React-idiomatic way would be to pass mapRef down and let parent call mapRef.current.fitBounds.
      // But given the current hook structure, this works.
      onResetToFullRouteView(resetToFullRouteView);
    }
  }, [onResetToFullRouteView, resetToFullRouteView]);

  // Pass resetToFullRouteView to the prop if available
  useEffect(() => {
    setMounted(true);
  }, []);

  const onMapClick = useCallback(
    (event: any) => {
      const feature = event.features?.[0];
      if (feature && onPointSelect) {
        onPointSelect(feature.properties.index);
      }
    },
    [onPointSelect],
  );

  const popupInfo = useMemo(() => {
    const idx = hoveredPointIdx !== null ? hoveredPointIdx : selectedPointIndex;
    if (idx !== null && weatherPoints?.[idx]) return { ...weatherPoints[idx], index: idx };
    return null;
  }, [hoveredPointIdx, selectedPointIndex, weatherPoints]);

  if (!mounted) return null;

  return (
    <div className="border-border relative h-full w-full overflow-hidden border">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: -3.7038, latitude: 40.4168, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle as any}
        onClick={onMapClick}
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
        />

        {/* 3D Player Marker (Dynamic Layer) */}
        {isPlayerActive && (
          <>
            <Source
              id="player-position"
              type="geojson"
              data={{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: {}
              }}
            >
              <Layer
                id="player-marker-glow"
                type="circle"
                paint={{
                  'circle-radius': 12,
                  'circle-color': '#3b82f6',
                  'circle-opacity': 0.3,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }}
              />
              <Layer
                id="player-marker-core"
                type="circle"
                paint={{
                  'circle-radius': 6,
                  'circle-color': '#ffffff',
                  'circle-stroke-width': 3,
                  'circle-stroke-color': '#3b82f6'
                }}
              />
            </Source>
          </>
        )}

        {popupInfo && <MapPopup popupInfo={popupInfo} onClose={() => setHoveredPointIdx(null)} />}

        {isPlayerActive && (
          <RoutePlayer
            points={points}
            map={mapRef.current}
            onPointUpdate={(idx) => {
              if (onPointSelect) onPointSelect(idx);
            }}
            onStop={() => {
              setIsPlayerActive(false);
              resetToFullRouteView();
            }}
          />
        )}
      </Map>

      {!isPlayerActive && points.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="bg-card/90 hover:bg-card hover:text-primary h-8 gap-2 text-[10px] font-bold uppercase shadow-md backdrop-blur-sm transition-all"
            onClick={() => setIsPlayerActive(true)}
          >
            <Box className="h-3.5 w-3.5" />
            {t('player.title')}
          </Button>
        </div>
      )}

      {selectedRange && !isPlayerActive && (
        <div className="animate-in fade-in slide-in-from-left-2 absolute top-3 left-3 z-10">
          <Button
            variant="secondary"
            size="sm"
            className="bg-card/90 hover:bg-card h-8 gap-2 shadow-md backdrop-blur-sm"
            onClick={onClearSelection}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">{t('resetView')}</span>
          </Button>
        </div>
      )}

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
