import { NextRequest, NextResponse } from 'next/server';
import { calculateWaterReliability } from '@/lib/utils';

interface Point {
  lat: number;
  lon: number;
}

export async function POST(request: NextRequest) {
  try {
    const { points }: { points: Point[] } = await request.json();

    if (!points || points.length === 0) {
      return NextResponse.json({ error: 'No points provided' }, { status: 400 });
    }

    // 1. Calculate Bounding Box with buffer
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const minLat = Math.min(...lats) - 0.02; // ~2km buffer
    const maxLat = Math.max(...lats) + 0.02;
    const minLon = Math.min(...lons) - 0.02;
    const maxLon = Math.max(...lons) + 0.02;
    const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;

    // 2. Optimized Overpass Query: One bbox call instead of many arounds
    const overpassQuery = `[out:json][timeout:30];
      (
        way["highway"](${bbox});
        node["place"~"village|town|hamlet"](${bbox});
        way["highway"~"primary|secondary|tertiary"](${bbox});
        node["amenity"="drinking_water"](${bbox});
        node["natural"="spring"](${bbox});
        node["man_made"="water_tap"](${bbox});
      );
      out center;`;

    const [osmResponse, elevationResponse] = await Promise.all([
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'peakOne/1.0',
        },
      }),
      // 3. Fetch Elevation Data
      fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${points.map((p) => p.lat).join(',')}&longitude=${points.map((p) => p.lon).join(',')}`,
      ),
    ]);

    const osmData = osmResponse.ok ? await osmResponse.json() : { elements: [] };
    const elevationData = elevationResponse.ok ? await elevationResponse.json() : { elevation: [] };

    const elements = osmData.elements || [];
    const elevations = elevationData.elevation || [];

    const getDistSq = (p1: Point, p2: { lat: number; lon: number }) =>
      Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2)) * 111.32; // Approx km

    // Pre-filter elements by category to speed up the loop
    const highwayElements = elements.filter((el: any) => el.tags?.highway);
    const escapeElements = elements.filter((el: any) => 
      el.tags?.place || (el.tags?.highway && ["primary", "secondary"].includes(el.tags.highway))
    );
    const waterElements = elements.filter((el: any) => 
      el.tags?.amenity === 'drinking_water' || el.tags?.natural === 'spring' || el.tags?.man_made === 'water_tap'
    );

    // Map everything back
    const pathData = points.map((p, idx) => {
      let closestWay = null;
      let minWayDist = Infinity;
      let closestEscape: any = null;
      let minEscapeDist = Infinity;
      let nearbyInfraCount = 0;

      // 1. Match Highways (within 100m)
      for (const element of highwayElements) {
        if (!element.center) continue;
        const dist = getDistSq(p, element.center);
        if (dist < 0.1 && dist < minWayDist) {
          minWayDist = dist;
          closestWay = element;
        }
        if (dist < 3) nearbyInfraCount++; // Coverage proxy
      }

      // 2. Match Escape Points (within 2.5km)
      for (const element of escapeElements) {
        const center = element.center || { lat: element.lat, lon: element.lon };
        const dist = getDistSq(p, center);
        if (dist < 2.5 && dist < minEscapeDist) {
          minEscapeDist = dist;
          closestEscape = element;
        }
      }

      const tags = closestWay?.tags || {};
      const escapeTags = closestEscape?.tags || {};
      
      // 3. Extract water sources (within 1.5km)
      const waterSources: any[] = waterElements
        .map((el: any) => {
          const center = el.center || { lat: el.lat, lon: el.lon };
          const dist = getDistSq(p, center);
          if (dist > 1.5) return null;

          const isNatural = el.tags?.natural === 'spring';
          return {
            lat: center.lat,
            lon: center.lon,
            name: el.tags?.name || (isNatural ? 'Manantial' : 'Fuente'),
            type: isNatural ? 'natural' : 'urban',
            distanceFromRoute: Math.round(dist * 10) / 10,
            reliability: calculateWaterReliability(isNatural ? 'natural' : 'urban', new Date())
          };
        })
        .filter(Boolean);

      // Heuristic for mobile coverage
      let coverage: 'none' | 'low' | 'full' = 'full';
      if (nearbyInfraCount === 0) coverage = 'none';
      else if (nearbyInfraCount < 3) coverage = 'low';

      return {
        lat: p.lat,
        lon: p.lon,
        pathType: tags.highway,
        surface: tags.surface || (tags.highway === 'cycleway' ? 'asphalt' : undefined),
        elevation: elevations[idx] !== undefined ? Math.round(elevations[idx]) : undefined,
        distanceFromStart: (p as any).distanceFromStart,
        mobileCoverage: coverage,
        waterSources,
        escapePoint: closestEscape ? {
          lat: closestEscape.center?.lat || closestEscape.lat,
          lon: closestEscape.center?.lon || closestEscape.lon,
          name: escapeTags.name || (escapeTags.highway ? 'Carretera principal' : 'Núcleo urbano'),
          type: escapeTags.place ? 'town' : 'road',
          distanceFromRoute: Math.round(minEscapeDist * 10) / 10
        } : undefined
      };
    });

    return NextResponse.json({ pathData });
  } catch (error) {
    console.error('Route info error:', error);
    return NextResponse.json({ error: 'Failed to fetch route info' }, { status: 500 });
  }
}
