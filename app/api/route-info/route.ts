import { NextRequest, NextResponse } from 'next/server';

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

    // Sample points for OSM (every 2nd to stay within limits)
    const sampledPoints = points.filter((_, i) => i % 2 === 0);

    // 1. Fetch OSM Data (Highway/Surface + Escape points)
    const queries = sampledPoints
      .map((p) => `way(around:100, ${p.lat}, ${p.lon})[highway];
                  node(around:2000, ${p.lat}, ${p.lon})[place~"village|town|hamlet"];
                  way(around:1500, ${p.lat}, ${p.lon})[highway~"primary|secondary|tertiary"];`)
      .join('');
    const overpassQuery = `[out:json][timeout:30]; (${queries}); out center;`;

    const [osmResponse, elevationResponse] = await Promise.all([
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RouteWeather/1.0',
        },
      }),
      // 2. Fetch Elevation Data for ALL points (to ensure Strava routes have a profile)
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

    // Map everything back
    const pathData = points.map((p, idx) => {
      let closestWay = null;
      let minWayDist = Infinity;
      let closestEscape: any = null;
      let minEscapeDist = Infinity;
      let nearbyInfraCount = 0;

      for (const element of elements) {
        if (!element.center && element.type !== 'node') continue;
        const center = element.center || { lat: element.lat, lon: element.lon };
        const dist = getDistSq(p, center);

        // Track highway for surface/type
        if (element.tags?.highway && dist < 0.1 && dist < minWayDist) {
          minWayDist = dist;
          closestWay = element;
        }

        // Track potential escape points
        if ((element.tags?.place || (element.tags?.highway && ["primary", "secondary"].includes(element.tags.highway))) && dist < 2.5) {
          if (dist < minEscapeDist) {
            minEscapeDist = dist;
            closestEscape = element;
          }
        }
        
        // Count infrastructure for coverage proxy
        if (dist < 3) nearbyInfraCount++;
      }

      const tags = closestWay?.tags || {};
      const escapeTags = closestEscape?.tags || {};
      
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
