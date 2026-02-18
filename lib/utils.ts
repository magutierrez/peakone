import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateIBP(
  distanceKm: number,
  elevationGainM: number,
  activityType: 'cycling' | 'walking' = 'cycling',
): number {
  if (distanceKm === 0) return 0;
  const distanceM = distanceKm * 1000;
  let ibp = 0;

  if (activityType === 'cycling') {
    // Simplified formula for cycling
    ibp = (elevationGainM * 100) / distanceM * 2 + elevationGainM / 40 + distanceKm / 2;
  } else {
    // Simplified formula for walking/hiking
    ibp = (elevationGainM * 100) / distanceM * 1.5 + elevationGainM / 50 + distanceKm / 2;
  }

  return Math.round(ibp);
}

export function getIBPDifficulty(
  ibp: number,
  activityType: 'cycling' | 'walking' = 'cycling',
): 'veryEasy' | 'easy' | 'moderate' | 'hard' | 'veryHard' | 'extreme' {
  if (activityType === 'cycling') {
    if (ibp <= 22) return 'veryEasy';
    if (ibp <= 44) return 'easy';
    if (ibp <= 79) return 'moderate';
    if (ibp <= 119) return 'hard';
    if (ibp <= 159) return 'veryHard';
    return 'extreme';
  } else {
    if (ibp <= 21) return 'veryEasy';
    if (ibp <= 42) return 'easy';
    if (ibp <= 73) return 'moderate';
    if (ibp <= 111) return 'hard';
    if (ibp <= 151) return 'veryHard';
    return 'extreme';
  }
}

// Astronomical constants
const PI = Math.PI;
const RAD = PI / 180;

export function getSunPosition(date: Date, lat: number, lon: number) {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = (date.getTime() / 86400000) - (new Date('2000-01-01T12:00:00Z').getTime() / 86400000);

  const n = d;
  const L = RAD * (280.46 + 0.9856474 * n);
  const g = RAD * (357.528 + 0.9856003 * n);

  const lambda = L + RAD * (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const epsilon = RAD * (23.439 - 0.0000004 * n);

  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  const siderealTime = RAD * (280.46061837 + 360.98564736629 * n) - lw;
  const H = siderealTime - ra;

  const h = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));

  return {
    altitude: h / RAD,
    azimuth: (az / RAD + 180) % 360,
  };
}

export function getSolarExposure(
  weather: { isDay?: number; directRadiation?: number; cloudCover?: number },
  sunPos: { altitude: number; azimuth: number },
  slopeDeg: number = 0,
  aspectDeg: number = 0,
): 'sun' | 'shade' | 'night' {
  if (sunPos.altitude <= 0 || weather.isDay === 0) return 'night';

  // 1. Terrain Shading (Hillshade)
  // Calculate incident angle on the slope
  const sunAltRad = sunPos.altitude * RAD;
  const sunAzRad = sunPos.azimuth * RAD;
  const slopeRad = slopeDeg * RAD;
  const aspectRad = aspectDeg * RAD;

  // Normal vector approach for incident angle theta
  const cosTheta =
    Math.sin(sunAltRad) * Math.cos(slopeRad) +
    Math.cos(sunAltRad) * Math.sin(slopeRad) * Math.cos(sunAzRad - aspectRad);

  // If the sun is below the local horizon (cosTheta <= 0), it's in local shadow
  if (cosTheta <= 0.05) {
    // 0.05 as a small buffer for grazing light
    return 'shade';
  }

  // 2. Radiation/Cloud Shading
  if (weather.directRadiation !== undefined && weather.directRadiation < 50) {
    return 'shade';
  }

  if (
    weather.directRadiation === undefined &&
    weather.cloudCover !== undefined &&
    weather.cloudCover > 85
  ) {
    return 'shade';
  }

  return 'sun';
}

export function getSolarIntensity(
  radiation: number | undefined,
  exposure: 'sun' | 'shade' | 'night',
): 'shade' | 'weak' | 'moderate' | 'intense' | 'night' {
  if (exposure === 'night') return 'night';
  if (exposure === 'shade' || (radiation !== undefined && radiation < 100)) return 'shade';

  const rad = radiation || 0;
  if (rad < 400) return 'weak';
  if (rad < 800) return 'moderate';
  return 'intense';
}

/**
 * Smart Time Estimation (Naismith's Rule adjusted)
 * Base time + 10 mins for every 100m of ascent (hiking)
 * For cycling, we use a power-loss model based on gradient
 */
export function calculateSmartSpeed(
  baseSpeed: number,
  distanceKm: number,
  elevationGainM: number,
  activityType: 'cycling' | 'walking',
): number {
  if (distanceKm === 0) return baseSpeed;

  if (activityType === 'walking') {
    // Naismith's Rule: 5km/h base + 1h per 600m ascent
    // This is approx 1 min extra per 10m of ascent
    const flatTimeHours = distanceKm / baseSpeed;
    const verticalPenaltyHours = elevationGainM / 600;
    const totalTime = flatTimeHours + verticalPenaltyHours;
    return distanceKm / totalTime;
  } else {
    // Cycling: Simplified speed reduction.
    // Every 100m of gain in 10km (1% grade) reduces speed by ~10%
    const grade = (elevationGainM / (distanceKm * 1000)) * 100;
    const speedFactor = Math.max(0.4, 1 - (grade * 0.05));
    return baseSpeed * speedFactor;
  }
}

/**
 * Hydration and Calorie Estimation
 */
export function calculatePhysiologicalNeeds(
  durationHours: number,
  distanceKm: number,
  elevationGainM: number,
  avgTemp: number,
  activityType: 'cycling' | 'walking',
) {
  const isHiking = activityType === 'walking';

  // 1. Calories (Metabolic Equivalent Task approximation)
  // Cycling ~ 8-12 METs, Hiking ~ 6-9 METs
  const baseMet = isHiking ? 7 : 10;
  const effortCorrection = 1 + (elevationGainM / 1000); // More gain = more effort
  const calories = Math.round(baseMet * 75 * durationHours * effortCorrection); // 75kg avg human

  // 2. Hydration (ml)
  // Base 500ml/h + 200ml for every 5°C above 20°C
  const heatFactor = avgTemp > 20 ? (avgTemp - 20) * 40 : 0;
  const hydrationMl = Math.round((500 + heatFactor) * durationHours * (isHiking ? 1.1 : 1.2));

  return {
    calories,
    waterLiters: Math.round((hydrationMl / 1000) * 10) / 10,
  };
}

export function calculateWaterReliability(
  sourceType: 'natural' | 'urban',
  date: Date,
): 'high' | 'medium' | 'low' {
  if (sourceType === 'urban') return 'high';

  const month = date.getMonth(); // 0-11
  const isSummer = month >= 5 && month <= 8; // June to Sept
  const isDrySeason = month >= 6 && month <= 7; // July and August

  if (isDrySeason) return 'low';
  if (isSummer) return 'medium';
  return 'high';
}

export interface RouteSegment {
  type: 'steepClimb' | 'steepDescent' | 'heatStress' | 'effort';
  dangerLevel: 'low' | 'medium' | 'high';
  climbCategory?: 'HC' | '1' | '2' | '3' | '4' | 'none';
  dangerColor: string;
  startDist: number;
  endDist: number;
  points: any[];
  maxSlope: number;
  avgSlope: number;
  avgTemp: number;
  lengthM: number;
  score: number;
}

export function analyzeRouteSegments(weatherPoints: any[]): RouteSegment[] {
  if (weatherPoints.length === 0) return [];

  const segments: RouteSegment[] = [];
  let currentSegment: any = null;

  const getClimbCategory = (score: number): RouteSegment['climbCategory'] => {
    if (score >= 80000) return 'HC';
    if (score >= 64000) return '1';
    if (score >= 32000) return '2';
    if (score >= 16000) return '3';
    if (score >= 8000) return '4';
    return 'none';
  };

  weatherPoints.forEach((wp, i) => {
    if (i === 0) return;
    const prev = weatherPoints[i - 1];
    const distKm = wp.point.distanceFromStart - prev.point.distanceFromStart;
    const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0);
    const slope = distKm > 0 ? (eleDiff / (distKm * 1000)) * 100 : 0;

    let type: RouteSegment['type'] | null = null;
    
    // Garmin-style thresholds:
    // Climb: Slope > 3%
    // Descent: Slope < -5%
    if (slope >= 3) {
      type = 'steepClimb';
    } else if (slope <= -5) {
      type = 'steepDescent';
    } else if (wp.weather.temperature > 26 && wp.solarIntensity === 'intense') {
      type = 'heatStress';
    }

    if (type) {
      if (!currentSegment || currentSegment.type !== type) {
        if (currentSegment) {
          // Finalize previous segment with Garmin logic
          finalizeSegment(currentSegment, segments);
        }
        currentSegment = {
          type,
          startDist: prev.point.distanceFromStart,
          points: [prev, wp],
          maxSlope: Math.abs(slope),
          avgTemp: wp.weather.temperature,
          endDist: wp.point.distanceFromStart
        };
      } else {
        currentSegment.points.push(wp);
        currentSegment.maxSlope = Math.max(currentSegment.maxSlope, Math.abs(slope));
        currentSegment.endDist = wp.point.distanceFromStart;
        currentSegment.avgTemp = (currentSegment.avgTemp + wp.weather.temperature) / 2;
      }
    } else if (currentSegment) {
      finalizeSegment(currentSegment, segments);
      currentSegment = null;
    }
  });

  if (currentSegment) finalizeSegment(currentSegment, segments);

  function finalizeSegment(seg: any, list: RouteSegment[]) {
    const lengthM = (seg.endDist - seg.startDist) * 1000;
    const firstPoint = seg.points[0].point;
    const lastPoint = seg.points[seg.points.length - 1].point;
    const totalEleDiff = (lastPoint.ele || 0) - (firstPoint.ele || 0);
    const avgSlope = lengthM > 0 ? (totalEleDiff / lengthM) * 100 : 0;
    const absAvgSlope = Math.abs(avgSlope);
    const score = lengthM * absAvgSlope;

    if (seg.type === 'steepClimb') {
      // Garmin ClimbPro thresholds: length > 500m, avg slope > 3%, score > 3500
      if (lengthM < 500 || absAvgSlope < 3 || score < 3500) return;
      
      const cat = getClimbCategory(score);
      seg.climbCategory = cat;
      seg.avgSlope = absAvgSlope;
      seg.lengthM = lengthM;
      seg.score = score;

      if (cat === 'HC' || cat === '1' || absAvgSlope > 12) {
        seg.dangerLevel = 'high';
        seg.dangerColor = 'text-red-600';
      } else if (cat === '2' || cat === '3' || absAvgSlope > 8) {
        seg.dangerLevel = 'medium';
        seg.dangerColor = 'text-orange-500';
      } else {
        seg.dangerLevel = 'low';
        seg.dangerColor = 'text-amber-500';
      }
    } else if (seg.type === 'steepDescent') {
      // Technical/Steep descent: length > 300m and avg slope < -5%
      if (lengthM < 300 || absAvgSlope < 5) return;
      
      seg.avgSlope = absAvgSlope;
      seg.lengthM = lengthM;
      seg.score = score;

      if (absAvgSlope > 15 || (absAvgSlope > 10 && lengthM > 2000)) {
        seg.dangerLevel = 'high';
        seg.dangerColor = 'text-red-600';
      } else if (absAvgSlope > 10 || (absAvgSlope > 7 && lengthM > 1000)) {
        seg.dangerLevel = 'medium';
        seg.dangerColor = 'text-orange-500';
      } else {
        seg.dangerLevel = 'low';
        seg.dangerColor = 'text-blue-400';
      }
    } else {
      // Heat Stress
      seg.avgSlope = absAvgSlope;
      seg.lengthM = lengthM;
      seg.score = score;
      if (seg.avgTemp > 32) {
        seg.dangerLevel = 'high';
        seg.dangerColor = 'text-red-600';
      } else {
        seg.dangerLevel = 'medium';
        seg.dangerColor = 'text-orange-500';
      }
    }

    list.push(seg);
  }

  return segments;
}

/**
 * Unit Conversions
 */
export function formatDistance(km: number, system: 'metric' | 'us' | 'uk' | 'imperial'): string {
  if (system === 'metric') return `${km.toFixed(1)} km`;
  const miles = km * 0.621371;
  return `${miles.toFixed(1)} mi`;
}

export function formatElevation(m: number, system: 'metric' | 'us' | 'uk' | 'imperial'): string {
  if (system === 'metric' || system === 'uk') return `${Math.round(m)} m`;
  const feet = m * 3.28084;
  return `${Math.round(feet)} ft`;
}

export function formatTemperature(c: number, system: 'metric' | 'us' | 'uk' | 'imperial'): string {
  if (system === 'us') {
    const f = (c * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(c)}°C`;
}

export function formatWindSpeed(kmh: number, unit: 'kmh' | 'mph' | 'knots' | 'ms'): string {
  switch (unit) {
    case 'mph':
      return `${Math.round(kmh * 0.621371)} mph`;
    case 'knots':
      return `${Math.round(kmh * 0.539957)} kn`;
    case 'ms':
      return `${(kmh / 3.6).toFixed(1)} m/s`;
    default:
      return `${Math.round(kmh)} km/h`;
  }
}

export function calculateElevationGainLoss(elevationPoints: { elevation: number }[]) {
  let totalElevationGain = 0;
  let totalElevationLoss = 0;

  if (elevationPoints.length < 2) {
    return { totalElevationGain, totalElevationLoss };
  }

  for (let i = 1; i < elevationPoints.length; i++) {
    const eleDiff = elevationPoints[i].elevation - elevationPoints[i - 1].elevation;
    if (eleDiff > 0) {
      totalElevationGain += eleDiff;
    } else {
      totalElevationLoss += Math.abs(eleDiff);
    }
  }

  return { totalElevationGain: Math.round(totalElevationGain), totalElevationLoss: Math.round(totalElevationLoss) };
}

export interface WindowScoreResult {
  startTime: string;
  score: number;
  reasons: string[];
  avgTemp: number;
  maxWind: number;
  maxPrecipProb: number;
  isNight: boolean;
}

export function calculateWindowScore(
  scenarios: Array<{
    point: any;
    weather: any;
    bearing: number;
  }>,
  activityType: 'cycling' | 'walking'
): number {
  let score = 100;
  
  scenarios.forEach((s) => {
    // 1. Precipitation Penalty (Heavy)
    if (s.weather.precipitationProbability > 20) {
      score -= (s.weather.precipitationProbability - 20) * 0.5;
    }
    if (s.weather.precipitation > 0.5) {
      score -= s.weather.precipitation * 10;
    }

    // 2. Wind Penalty
    if (s.weather.windSpeed > 25) {
      score -= (s.weather.windSpeed - 25) * 1.5;
    }

    // 3. Temperature (Comfort zone 10-25°C)
    if (s.weather.temperature > 28) score -= (s.weather.temperature - 28) * 2;
    if (s.weather.temperature < 5) score -= (5 - s.weather.temperature) * 3;

    // 4. Night Penalty
    if (s.weather.isDay === 0) {
      score -= 20;
    }

    // 5. Wind Direction (for Cycling)
    if (activityType === 'cycling') {
      const windTo = (s.weather.windDirection + 180) % 360;
      let angleDiff = Math.abs(windTo - s.bearing);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      
      if (angleDiff < 45) score += 2; // Tailwind bonus
      if (angleDiff > 135) score -= 5; // Headwind penalty
    }
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}
