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

    // We sample every 2nd point to avoid hitting API limits while maintaining coverage
    const sampledPoints = points.filter((_, i) => i % 2 === 0)

    // Construct Overpass query to find nearest ways for these points
    // Radius of 50m handles GPS inaccuracies
    const queries = sampledPoints
      .map((p) => `way(around:50, ${p.lat}, ${p.lon})[highway];`)
      .join('')

    const overpassQuery = `[out:json][timeout:30];
      (
        ${queries}
      );
      out center;`

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RouteWeather/1.0',
      },
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Overpass API error:', err)
      return NextResponse.json({ pathData: [] })
    }

    const data = await response.json()
    const elements = data.elements || []

    // Simple Euclidean distance squared for matching (fine for small local distances)
    const getDistSq = (p1: Point, p2: { lat: number; lon: number }) => {
      return Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lon - p2.lon, 2)
    }

    // Map points back to their closest way tags
    const pathData = sampledPoints.map((p) => {
      let closestWay = null
      let minContextDist = Infinity

      for (const element of elements) {
        if (!element.center) continue
        const dist = getDistSq(p, element.center)
        if (dist < minContextDist) {
          minContextDist = dist
          closestWay = element
        }
      }

      const tags = closestWay?.tags || {}
      return {
        lat: p.lat,
        lon: p.lon,
        pathType: tags.highway || 'unknown',
        surface: tags.surface || (tags.highway === 'cycleway' ? 'asphalt' : 'unknown'),
      }
    })

    return NextResponse.json({ pathData })
  } catch (error) {
    console.error('Route info error:', error)
    return NextResponse.json({ error: 'Failed to fetch route info' }, { status: 500 })
  }
}
