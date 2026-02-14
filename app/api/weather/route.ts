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

    // Group points by unique lat/lon (rounded to reduce API calls)
    const uniqueLocations = new Map<string, { lat: number; lon: number; times: string[]; indices: number[] }>()

    points.forEach((point, index) => {
      const key = `${point.lat.toFixed(2)},${point.lon.toFixed(2)}`
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, {
          lat: point.lat,
          lon: point.lon,
          times: [],
          indices: [],
        })
      }
      const loc = uniqueLocations.get(key)!
      loc.times.push(point.estimatedTime)
      loc.indices.push(index)
    })

    // Fetch weather for each unique location from Open-Meteo
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

    const locationEntries = Array.from(uniqueLocations.entries())

    // Batch fetch - Open-Meteo supports multiple locations
    const fetchPromises = locationEntries.map(async ([, loc]) => {
      const startDate = loc.times[0].split('T')[0]
      const endDate = loc.times[loc.times.length - 1].split('T')[0]

      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.searchParams.set('latitude', loc.lat.toString())
      url.searchParams.set('longitude', loc.lon.toString())
      url.searchParams.set('hourly', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility')
      url.searchParams.set('start_date', startDate)
      url.searchParams.set('end_date', endDate || startDate)
      url.searchParams.set('timezone', 'auto')

      const res = await fetch(url.toString())
      if (!res.ok) {
        throw new Error(`Open-Meteo API error: ${res.status}`)
      }

      const data = await res.json()
      return { loc, data }
    })

    const results = await Promise.all(fetchPromises)

    // Match each point to its closest hourly weather data
    results.forEach(({ loc, data }) => {
      const hourlyTimes = data.hourly.time as string[]

      loc.indices.forEach((pointIndex, i) => {
        const targetTime = loc.times[i]
        const targetDate = new Date(targetTime)

        // Find closest hour
        let closestIdx = 0
        let closestDiff = Infinity

        hourlyTimes.forEach((t: string, idx: number) => {
          const diff = Math.abs(new Date(t).getTime() - targetDate.getTime())
          if (diff < closestDiff) {
            closestDiff = diff
            closestIdx = idx
          }
        })

        weatherResults.push({
          index: pointIndex,
          weather: {
            time: hourlyTimes[closestIdx],
            temperature: data.hourly.temperature_2m[closestIdx],
            apparentTemperature: data.hourly.apparent_temperature[closestIdx],
            humidity: data.hourly.relative_humidity_2m[closestIdx],
            precipitation: data.hourly.precipitation[closestIdx],
            precipitationProbability: data.hourly.precipitation_probability[closestIdx],
            weatherCode: data.hourly.weather_code[closestIdx],
            windSpeed: data.hourly.wind_speed_10m[closestIdx],
            windDirection: data.hourly.wind_direction_10m[closestIdx],
            windGusts: data.hourly.wind_gusts_10m[closestIdx],
            cloudCover: data.hourly.cloud_cover[closestIdx],
            visibility: data.hourly.visibility[closestIdx],
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
