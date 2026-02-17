'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Map, { Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { RoutePoint, RouteWeatherPoint } from '@/lib/types';
import { useMapLayers } from './route-map/use-map-layers';
import { MapMarkers } from './route-map/map-markers';
import { MapPopup } from './route-map/map-popup';
import { MapLegend } from './route-map/map-legend';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RouteMapProps {
  points: RoutePoint[];
  weatherPoints?: RouteWeatherPoint[];
  selectedPointIndex?: number | null;
  onPointSelect?: (index: number) => void;
  activeFilter?: { key: 'pathType' | 'surface'; value: string } | null;
  selectedRange?: { start: number; end: number } | null;
}

type MapLayerType = 'standard' | 'satellite' | 'hybrid' | 'topography';

export default function RouteMap({
  points,
  weatherPoints,
  selectedPointIndex = null,
  onPointSelect,
  activeFilter = null,
  selectedRange = null,
}: RouteMapProps) {
  const { resolvedTheme } = useTheme();
  const t = useTranslations('RouteMap');
  const mapRef = useRef<MapRef>(null);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapType, setMapType] = useState<MapLayerType>('standard');

  const { routeData, highlightedData, rangeHighlightData, weatherPointsData } = useMapLayers(
    points,
    weatherPoints,
    activeFilter,
    selectedRange,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const mapStyle = useMemo(() => {
    if (mapType === 'standard') {
      return resolvedTheme === 'light'
        ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    }

    if (mapType === 'topography') {
      return {
        version: 8,
        sources: {
          'opentopo': {
            type: 'raster',
            tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
          },
        },
        layers: [
          {
            id: 'topography-layer',
            type: 'raster',
            source: 'opentopo',
          },
        ],
      };
    }

    return {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri',
        },
        'esri-labels': {
          type: 'raster',
          tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'satellite',
          type: 'raster',
          source: 'esri-satellite',
        },
        ...(mapType === 'hybrid'
          ? [
              {
                id: 'labels',
                type: 'raster',
                source: 'esri-labels',
                paint: { 'raster-opacity': 0.8 },
              },
            ]
          : []),
      ],
    };
  }, [resolvedTheme, mapType]);

  useEffect(() => {
    const validPoints = points.filter(
      (p) =>
        typeof p.lon === 'number' &&
        typeof p.lat === 'number' &&
        !isNaN(p.lon) &&
        !isNaN(p.lat),
    );
    if (validPoints.length > 0 && mapRef.current) {
      const lons = validPoints.map((p) => p.lon);
      const lats = validPoints.map((p) => p.lat);
      mapRef.current.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: 40, duration: 1000 },
      );
    }
  }, [points]);

  useEffect(() => {
    if (selectedRange && mapRef.current) {
      const rangePoints = points.filter(
        (p) =>
          typeof p.lon === 'number' &&
          typeof p.lat === 'number' &&
          !isNaN(p.lon) &&
          !isNaN(p.lat) &&
          p.distanceFromStart >= selectedRange.start &&
          p.distanceFromStart <= selectedRange.end,
      );
      if (rangePoints.length > 0) {
        const lons = rangePoints.map((p) => p.lon);
        const lats = rangePoints.map((p) => p.lat);
        mapRef.current.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: 60, duration: 800 },
        );
      }
    }
  }, [selectedRange, points]);

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
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: -3.7038, latitude: 40.4168, zoom: 5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle as any}
        onClick={onMapClick}
      >
        <NavigationControl position="bottom-right" />

        {routeData && (
          <Source id="route-source" type="geojson" data={routeData}>
            <Layer
              id="route-base"
              type="line"
              paint={{
                'line-color': mapType === 'standard' ? '#3ecf8e' : '#ffffff',
                'line-width': 4,
                'line-opacity': activeFilter || selectedRange ? 0.3 : 1,
              }}
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            />
          </Source>
        )}

        {highlightedData && (
          <Source id="highlight-source" type="geojson" data={highlightedData}>
            <Layer
              id="highlight-glow"
              type="line"
              paint={{
                'line-color': '#3ecf8e',
                'line-width': 8,
                'line-opacity': 0.4,
                'line-blur': 4,
              }}
            />
            <Layer
              id="highlight-line"
              type="line"
              paint={{ 'line-color': '#3ecf8e', 'line-width': 4, 'line-opacity': 1 }}
            />
          </Source>
        )}

        {rangeHighlightData && (
          <Source id="range-source" type="geojson" data={rangeHighlightData}>
            <Layer
              id="range-glow"
              type="line"
              paint={{
                'line-color': '#007aff',
                'line-width': 10,
                'line-opacity': 0.3,
                'line-blur': 6,
              }}
            />
            <Layer
              id="range-line"
              type="line"
              paint={{ 'line-color': '#007aff', 'line-width': 5, 'line-opacity': 1 }}
            />
          </Source>
        )}

        <MapMarkers
          points={points}
          weatherPoints={weatherPoints}
          selectedPointIndex={selectedPointIndex}
          activeFilter={activeFilter}
          onPointSelect={onPointSelect}
          onHoverPoint={setHoveredPointIdx}
        />

        {popupInfo && <MapPopup popupInfo={popupInfo} onClose={() => setHoveredPointIdx(null)} />}
      </Map>

      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-10 w-10 shadow-md">
              <Layers className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={mapType} onValueChange={(v) => setMapType(v as MapLayerType)}>
              <DropdownMenuRadioItem value="standard">{t('layers.standard')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="topography">{t('layers.topography')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="satellite">{t('layers.satellite')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="hybrid">{t('layers.hybrid')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <style jsx global>{`
        .weather-popup .maplibregl-popup-content {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
        }
      `}</style>

      {weatherPoints && weatherPoints.length > 0 && <MapLegend />}
    </div>
  );
}
