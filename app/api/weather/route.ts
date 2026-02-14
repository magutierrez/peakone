import { NextRequest, NextResponse } from 'next/server'

interface WeatherRequest {
  points: Array<{
    lat: number
    lon: number
    estimatedTime: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: WeatherRequest = await request.json()
    const { points } = body

    if (!points || points.length === 0) {
      return NextResponse.json({ error: 'No points provided' }, { status: 400 })
    }

    const uniqueLocations = new Map<string, { lat: number; lon: number; times: string[]; indices: number[] }>()

    points.forEach((point, index) => {
      const key = `${point.lat.toFixed(2)},${point.lon.toFixed(2)}`
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, {
          lat: parseFloat(point.lat.toFixed(2)),
          lon: parseFloat(point.lon.toFixed(2)),
          times: [],
          indices: [],
        })
      }
      const loc = uniqueLocations.get(key)!
      loc.times.push(point.estimatedTime)
      loc.indices.push(index)
    })

    const locationEntries = Array.from(uniqueLocations.values())
    
    // Get global date range for all points
    const allTimes = points.map(p => new Date(p.estimatedTime).getTime())
    const minTime = new Date(Math.min(...allTimes))
    const maxTime = new Date(Math.max(...allTimes))
    const startDate = minTime.toISOString().split('T')[0]
    const endDate = maxTime.toISOString().split('T')[0]

    // Batch fetch - Open-Meteo supports multiple locations with comma-separated coordinates
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', locationEntries.map(l => l.lat).join(','))
    url.searchParams.set('longitude', locationEntries.map(l => l.lon).join(','))
    url.searchParams.set('hourly', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility')
    url.searchParams.set('start_date', startDate)
    url.searchParams.set('end_date', endDate)
    url.searchParams.set('timezone', 'auto')

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RouteWeather/1.0'
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Open-Meteo error response:', errorText)
      throw new Error(`Open-Meteo API error: ${res.status}`)
    }

    const data = await res.json()
    
    // Open-Meteo returns an array of results when multiple locations are requested
    // If only one location is requested, it might return a single object or an array of one
    const resultsArray = Array.isArray(data) ? data : [data]

    const weatherResults: Array<{
      index: number
      weather: {
        time: string
        temperature: number
        apparentTemperature: number
        humidity: number
        precipitation: number
        precipitationProbability: number
        weatherCode: number
        windSpeed: number
        windDirection: number
        windGusts: number
        cloudCover: number
        visibility: number
      }
    }> = []

    resultsArray.forEach((locationData, locationIdx) => {
      const loc = locationEntries[locationIdx]
      const hourlyTimes = locationData.hourly.time as string[]

      loc.indices.forEach((pointIndex, i) => {
        const targetTime = loc.times[i]
        const targetDate = new Date(targetTime).getTime()

        // Find closest hour
        let closestIdx = 0
        let closestDiff = Infinity

        hourlyTimes.forEach((t: string, idx: number) => {
          const diff = Math.abs(new Date(t).getTime() - targetDate)
          if (diff < closestDiff) {
            closestDiff = diff
            closestIdx = idx
          }
        })

        weatherResults.push({
          index: pointIndex,
          weather: {
            time: hourlyTimes[closestIdx],
            temperature: locationData.hourly.temperature_2m[closestIdx],
            apparentTemperature: locationData.hourly.apparent_temperature[closestIdx],
            humidity: locationData.hourly.relative_humidity_2m[closestIdx],
            precipitation: locationData.hourly.precipitation[closestIdx],
            precipitationProbability: locationData.hourly.precipitation_probability[closestIdx],
            weatherCode: locationData.hourly.weather_code[closestIdx],
            windSpeed: locationData.hourly.wind_speed_10m[closestIdx],
            windDirection: locationData.hourly.wind_direction_10m[closestIdx],
            windGusts: locationData.hourly.wind_gusts_10m[closestIdx],
            cloudCover: locationData.hourly.cloud_cover[closestIdx],
            visibility: locationData.hourly.visibility[closestIdx],
          },
        })
      })
    })

    // Sort by original index
    weatherResults.sort((a, b) => a.index - b.index)

    return NextResponse.json({
      weather: weatherResults.map(r => r.weather),
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
