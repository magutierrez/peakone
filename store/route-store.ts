import { create } from 'zustand';
import type { GPXData, RouteConfig, RouteWeatherPoint } from '@/lib/types';

export type ActiveFilter = {
  key: 'pathType' | 'surface' | 'hazard';
  value: string;
} | null;

interface RouteState {
  // ── UI / Map state ──────────────────────────────────────────────────────────
  activeFilter: ActiveFilter;
  selectedRange: { start: number; end: number } | null;
  /** Set by map hover → chart reads it to show the reference line */
  exactSelectedPoint: any | null;
  /** Set by chart hover → map reads it to show the cursor dot */
  chartHoverPoint: any | null;
  focusPoint: { lat: number; lon: number; name?: string } | null;
  showWaterSources: boolean;
  selectedPointIndex: number | null;
  config: RouteConfig;

  // ── Fetched route data (set by home-page-client from DB) ────────────────────
  fetchedRawGpxContent: string | null;
  fetchedGpxFileName: string | null;
  fetchedActivityType: 'cycling' | 'walking';
  initialDistance: number;
  initialElevationGain: number;
  initialElevationLoss: number;

  // ── Analysis results (managed by useRouteAnalysis hook) ─────────────────────
  gpxData: GPXData | null;
  gpxFileName: string | null;
  rawGPXContent: string | null;
  weatherPoints: RouteWeatherPoint[];
  elevationData: { distance: number; elevation: number }[];
  routeInfoData: any[];
  isLoading: boolean;
  isRouteInfoLoading: boolean;
  error: string | null;
  recalculatedElevationGain: number;
  recalculatedElevationLoss: number;
  recalculatedTotalDistance: number;
  isWeatherAnalyzed: boolean;
  bestWindows: any[];
  isFindingWindow: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────
  setActiveFilter: (filter: ActiveFilter) => void;
  setSelectedRange: (range: { start: number; end: number } | null) => void;
  setExactSelectedPoint: (point: any | null) => void;
  setChartHoverPoint: (point: any | null) => void;
  setFocusPoint: (point: { lat: number; lon: number; name?: string } | null) => void;
  setShowWaterSources: (show: boolean) => void;
  setSelectedPointIndex: (index: number | null) => void;
  setConfig: (config: RouteConfig) => void;
  setFetchedRoute: (data: {
    rawGpxContent: string;
    gpxFileName: string;
    activityType: 'cycling' | 'walking';
    distance: number;
    elevationGain: number;
    elevationLoss: number;
  }) => void;
  clearSelection: () => void;
  reset: () => void;

  // Analysis state setters (used internally by useRouteAnalysis hook)
  setGpxData: (data: GPXData | null) => void;
  setGpxFileName: (name: string | null) => void;
  setRawGPXContent: (content: string | null) => void;
  setWeatherPoints: (points: RouteWeatherPoint[]) => void;
  setElevationData: (data: { distance: number; elevation: number }[]) => void;
  setRouteInfoData: (data: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsRouteInfoLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRecalculatedElevationGain: (gain: number) => void;
  setRecalculatedElevationLoss: (loss: number) => void;
  setRecalculatedTotalDistance: (distance: number) => void;
  setIsWeatherAnalyzed: (analyzed: boolean) => void;
  setBestWindows: (windows: any[]) => void;
  setIsFindingWindow: (finding: boolean) => void;
}

function getDefaultDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

const initialState = {
  activeFilter: null as ActiveFilter,
  selectedRange: null as { start: number; end: number } | null,
  exactSelectedPoint: null,
  chartHoverPoint: null,
  focusPoint: null as { lat: number; lon: number; name?: string } | null,
  showWaterSources: false,
  selectedPointIndex: null as number | null,
  config: { date: getDefaultDate(), time: '08:00', speed: 25 } as RouteConfig,

  fetchedRawGpxContent: null as string | null,
  fetchedGpxFileName: null as string | null,
  fetchedActivityType: 'cycling' as 'cycling' | 'walking',
  initialDistance: 0,
  initialElevationGain: 0,
  initialElevationLoss: 0,

  gpxData: null as GPXData | null,
  gpxFileName: null as string | null,
  rawGPXContent: null as string | null,
  weatherPoints: [] as RouteWeatherPoint[],
  elevationData: [] as { distance: number; elevation: number }[],
  routeInfoData: [] as any[],
  isLoading: false,
  isRouteInfoLoading: false,
  error: null as string | null,
  recalculatedElevationGain: 0,
  recalculatedElevationLoss: 0,
  recalculatedTotalDistance: 0,
  isWeatherAnalyzed: false,
  bestWindows: [] as any[],
  isFindingWindow: false,
};

export const useRouteStore = create<RouteState>()((set) => ({
  ...initialState,

  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  setExactSelectedPoint: (point) => set({ exactSelectedPoint: point }),
  setChartHoverPoint: (point) => set({ chartHoverPoint: point }),
  setFocusPoint: (point) => set({ focusPoint: point }),
  setShowWaterSources: (show) => set({ showWaterSources: show }),
  setSelectedPointIndex: (index) => set({ selectedPointIndex: index }),
  setConfig: (config) => set({ config }),

  setFetchedRoute: ({ rawGpxContent, gpxFileName, activityType, distance, elevationGain, elevationLoss }) =>
    set({
      fetchedRawGpxContent: rawGpxContent,
      fetchedGpxFileName: gpxFileName,
      fetchedActivityType: activityType,
      initialDistance: distance,
      initialElevationGain: elevationGain,
      initialElevationLoss: elevationLoss,
    }),

  clearSelection: () => set({ selectedRange: null, activeFilter: null }),
  reset: () => set({ ...initialState, config: { date: getDefaultDate(), time: '08:00', speed: 25 } }),

  setGpxData: (data) => set({ gpxData: data }),
  setGpxFileName: (name) => set({ gpxFileName: name }),
  setRawGPXContent: (content) => set({ rawGPXContent: content }),
  setWeatherPoints: (points) => set({ weatherPoints: points }),
  setElevationData: (data) => set({ elevationData: data }),
  setRouteInfoData: (data) => set({ routeInfoData: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsRouteInfoLoading: (loading) => set({ isRouteInfoLoading: loading }),
  setError: (error) => set({ error }),
  setRecalculatedElevationGain: (gain) => set({ recalculatedElevationGain: gain }),
  setRecalculatedElevationLoss: (loss) => set({ recalculatedElevationLoss: loss }),
  setRecalculatedTotalDistance: (distance) => set({ recalculatedTotalDistance: distance }),
  setIsWeatherAnalyzed: (analyzed) => set({ isWeatherAnalyzed: analyzed }),
  setBestWindows: (windows) => set({ bestWindows: windows }),
  setIsFindingWindow: (finding) => set({ isFindingWindow: finding }),
}));
