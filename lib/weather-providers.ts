import { WeatherData } from './types';

export interface WeatherProvider {
  name: string;
  fetchWeather: (params: {
    locations: { lat: number; lon: number; indices: number[]; times: string[] }[];
    startDate: string;
    endDate: string;
  }) => Promise<Array<{ index: number; weather: WeatherData }>>;
}

// Helper to find the closest hourly data point
export function findClosestWeather(
  hourlyTimes: string[],
  targetTime: string,
  dataArrays: Record<string, any[]>,
) {
  const targetDate = new Date(targetTime).getTime();
  let closestIdx = 0;
  let closestDiff = Infinity;

  hourlyTimes.forEach((t, idx) => {
    const diff = Math.abs(new Date(t).getTime() - targetDate);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = idx;
    }
  });

  const result: any = { time: hourlyTimes[closestIdx] };
  for (const key in dataArrays) {
    result[key] = dataArrays[key][closestIdx];
  }
  return result;
}

export const openMeteoProvider: WeatherProvider = {
  name: 'Open-Meteo',
  fetchWeather: async ({ locations, startDate, endDate }) => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', locations.map((l) => l.lat).join(','));
    url.searchParams.set('longitude', locations.map((l) => l.lon).join(','));
    url.searchParams.set(
      'hourly',
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility',
    );
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': 'RouteWeather/1.0' },
    });

    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();
    const resultsArray = Array.isArray(data) ? data : [data];

    const weatherResults: Array<{ index: number; weather: WeatherData }> = [];

    resultsArray.forEach((locationData, locationIdx) => {
      const loc = locations[locationIdx];
      loc.indices.forEach((pointIndex, i) => {
        const closest = findClosestWeather(locationData.hourly.time, loc.times[i], {
          temperature: locationData.hourly.temperature_2m,
          apparentTemperature: locationData.hourly.apparent_temperature,
          humidity: locationData.hourly.relative_humidity_2m,
          precipitation: locationData.hourly.precipitation,
          precipitationProbability: locationData.hourly.precipitation_probability,
          weatherCode: locationData.hourly.weather_code,
          windSpeed: locationData.hourly.wind_speed_10m,
          windDirection: locationData.hourly.wind_direction_10m,
          windGusts: locationData.hourly.wind_gusts_10m,
          cloudCover: locationData.hourly.cloud_cover,
          visibility: locationData.hourly.visibility,
        });

        weatherResults.push({ index: pointIndex, weather: closest });
      });
    });

    return weatherResults;
  },
};

// Mapping WeatherAPI codes to WMO (Open-Meteo) codes for consistency
// This is a simplified mapping
const weatherApiToWmo: Record<number, number> = {
  1000: 0, // Sunny/Clear
  1003: 1, // Partly cloudy
  1006: 3, // Cloudy
  1009: 3, // Overcast
  1030: 45, // Mist
  1063: 51, // Patchy rain possible
  1183: 61, // Light rain
  1189: 63, // Moderate rain
  1195: 65, // Heavy rain
  // ... more mappings could be added
};

export const weatherApiProvider: WeatherProvider = {
  name: 'WeatherAPI',
  fetchWeather: async ({ locations, startDate }) => {
    const apiKey = process.env.WEATHERAPI_API_KEY;
    if (!apiKey) throw new Error('WeatherAPI key missing');

    // WeatherAPI doesn't support batching locations in one call easily for historical/forecast
    // So we fetch for each unique location. Since we rounded locations to 2 decimals,
    // it should be manageable.
    const allResults = await Promise.all(
      locations.map(async (loc) => {
        const url = new URL('https://api.weatherapi.com/v1/forecast.json');
        url.searchParams.set('key', apiKey);
        url.searchParams.set('q', `${loc.lat},${loc.lon}`);
        url.searchParams.set('days', '3');
        url.searchParams.set('aqi', 'no');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`WeatherAPI error: ${res.status}`);
        const data = await res.json();

        const hourlyData = data.forecast.forecastday.flatMap((day: any) => day.hour);
        const hourlyTimes = hourlyData.map((h: any) => h.time);

        return loc.indices.map((pointIndex, i) => {
          const closest = findClosestWeather(hourlyTimes, loc.times[i], {
            temperature: hourlyData.map((h: any) => h.temp_c),
            apparentTemperature: hourlyData.map((h: any) => h.feelslike_c),
            humidity: hourlyData.map((h: any) => h.humidity),
            precipitation: hourlyData.map((h: any) => h.precip_mm),
            precipitationProbability: hourlyData.map((h: any) => h.chance_of_rain), // simplified
            weatherCode: hourlyData.map((h: any) => weatherApiToWmo[h.condition.code] || 0),
            windSpeed: hourlyData.map((h: any) => h.wind_kph),
            windDirection: hourlyData.map((h: any) => h.wind_degree),
            windGusts: hourlyData.map((h: any) => h.gust_kph),
            cloudCover: hourlyData.map((h: any) => h.cloud),
            visibility: hourlyData.map((h: any) => h.vis_km * 1000),
          });
          return { index: pointIndex, weather: closest };
        });
      }),
    );

    return allResults.flat();
  },
};

// Tomorrow.io mapping
const tomorrowToWmo: Record<number, number> = {
  1000: 0, // Clear
  1100: 1, // Mostly Clear
  1101: 2, // Partly Cloudy
  1102: 3, // Mostly Cloudy
  1001: 3, // Cloudy
  4000: 51, // Drizzle
  4001: 61, // Rain
  4200: 61, // Light Rain
  4201: 65, // Heavy Rain
  // ...
};

export const tomorrowIoProvider: WeatherProvider = {
  name: 'Tomorrow.io',
  fetchWeather: async ({ locations, startDate, endDate }) => {
    const apiKey = process.env.TOMORROW_IO_API_KEY;
    if (!apiKey) throw new Error('Tomorrow.io key missing');

    const allResults = await Promise.all(
      locations.map(async (loc) => {
        const url = new URL('https://api.tomorrow.io/v4/weather/forecast');
        url.searchParams.set('location', `${loc.lat},${loc.lon}`);
        url.searchParams.set('apikey', apiKey);
        url.searchParams.set('units', 'metric');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Tomorrow.io error: ${res.status}`);
        const data = await res.json();

        const hourlyData = data.timelines.hourly;
        const hourlyTimes = hourlyData.map((h: any) => h.time);

        return loc.indices.map((pointIndex, i) => {
          const closest = findClosestWeather(hourlyTimes, loc.times[i], {
            temperature: hourlyData.map((h: any) => h.values.temperature),
            apparentTemperature: hourlyData.map((h: any) => h.values.temperatureApparent),
            humidity: hourlyData.map((h: any) => h.values.humidity),
            precipitation: hourlyData.map((h: any) => h.values.precipitationIntensity),
            precipitationProbability: hourlyData.map((h: any) => h.values.precipitationProbability),
            weatherCode: hourlyData.map((h: any) => tomorrowToWmo[h.values.weatherCode] || 0),
            windSpeed: hourlyData.map((h: any) => h.values.windSpeed * 3.6), // m/s to km/h
            windDirection: hourlyData.map((h: any) => h.values.windDirection),
            windGusts: hourlyData.map((h: any) => h.values.windGust * 3.6), // m/s to km/h
            cloudCover: hourlyData.map((h: any) => h.values.cloudCover),
            visibility: hourlyData.map((h: any) => h.values.visibility * 1000),
          });
          return { index: pointIndex, weather: closest };
        });
      }),
    );

    return allResults.flat();
  },
};
