import { NextRequest, NextResponse } from 'next/server'

interface Point {
  lat: number
  lon: number
}

export async function POST(request: NextRequest) {
  try {
    const { points }: { points: Point[] } = await request.json()

    if (!points || points.length === 0) {
      return NextResponse.json({ error: 'No points provided' }, { status: 400 })
    }

    // Sample points for OSM (every 2nd to stay within limits)
    const sampledPoints = points.filter((_, i) => i % 2 === 0)

    // 1. Fetch OSM Data (Highway/Surface)
    const queries = sampledPoints.map((p) => `way(around:50, ${p.lat}, ${p.lon})[highway];`).join('')
    const overpassQuery = `[out:json][timeout:30]; (${queries}); out center;`

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
    ])

    const osmData = osmResponse.ok ? await osmResponse.json() : { elements: [] }
    const elevationData = elevationResponse.ok ? await elevationResponse.json() : { elevation: [] }

    const elements = osmData.elements || []
    const elevations = elevationData.elevation || []

    const getDistSq = (p1: Point, p2: { lat: number; lon: number }) =>
      Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2)

    // Map everything back
    const pathData = points.map((p, idx) => {
      let closestWay = null
      let minContextDist = Infinity

      // Only search OSM for sampled points to save CPU
      if (idx % 2 === 0) {
        for (const element of elements) {
          if (!element.center) continue
          const dist = getDistSq(p, element.center)
          if (dist < minContextDist) {
            minContextDist = dist
            closestWay = element
          }
        }
      }

      const tags = closestWay?.tags || {}
      return {
        lat: p.lat,
        lon: p.lon,
        pathType: tags.highway,
        surface: tags.surface || (tags.highway === 'cycleway' ? 'asphalt' : undefined),
        elevation: elevations[idx] !== undefined ? Math.round(elevations[idx]) : undefined, // Use fetched elevation rounded
        // @ts-ignore - p might have distanceFromStart if passed
        distanceFromStart: p.distanceFromStart
      }
    })

    return NextResponse.json({ pathData })
  } catch (error) {
    console.error('Route info error:', error)
    return NextResponse.json({ error: 'Failed to fetch route info' }, { status: 500 })
  }
}