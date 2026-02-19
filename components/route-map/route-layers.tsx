'use client';

import { Source, Layer } from 'react-map-gl/maplibre';

interface RouteLayersProps {
  mapType: string;
  routeData: any;
  highlightedData: any;
  rangeHighlightData: any;
  activeFilter: any;
  selectedRange: any;
}

export function RouteLayers({
  mapType,
  routeData,
  highlightedData,
  rangeHighlightData,
  activeFilter,
  selectedRange,
}: RouteLayersProps) {
  return (
    <>
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
          <Layer
            id="route-direction-arrows"
            type="symbol"
            layout={{
              'symbol-placement': 'line',
              'symbol-spacing': 80, // More frequent arrows
              'text-field': '>', 
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                10, 12,
                18, 24
              ],
              'text-keep-upright': false,
              'text-allow-overlap': true,
              'text-rotate': 0, // In line-placement, 0 is along the line
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            }}
            paint={{
              'text-color': mapType === 'standard' ? '#065f46' : '#ffffff',
              'text-opacity': activeFilter || selectedRange ? 0.4 : 1,
              'text-halo-color': mapType === 'standard' ? '#ffffff' : '#000000',
              'text-halo-width': 2,
            }}
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
            paint={{ 
              'line-color': ['coalesce', ['get', 'color'], '#3ecf8e'], 
              'line-width': 6, 
              'line-opacity': 1 
            }}
          />
        </Source>
      )}

      {rangeHighlightData && !activeFilter && (
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
    </>
  );
}
