import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  dangerColor: string;
  startDist: number;
  endDist: number;
  points: any[];
  maxSlope: number;
  avgTemp: number;
}

export function analyzeRouteSegments(weatherPoints: any[]): RouteSegment[] {
  if (weatherPoints.length === 0) return [];

  const segments: RouteSegment[] = [];
  let currentSegment: any = null;

  weatherPoints.forEach((wp, i) => {
    if (i === 0) return;
    const prev = weatherPoints[i - 1];
    const dist = wp.point.distanceFromStart - prev.point.distanceFromStart;
    const eleDiff = (wp.point.ele || 0) - (prev.point.ele || 0);
    const slope = dist > 0 ? (eleDiff / (dist * 1000)) * 100 : 0;

    let type: RouteSegment['type'] | null = null;
    let dangerLevel: RouteSegment['dangerLevel'] = 'low';
    let dangerColor = 'text-blue-500';

    // 1. Subidas
    if (slope > 4) {
      type = 'steepClimb';
      if (slope > 10) {
        dangerLevel = 'high';
        dangerColor = 'text-red-600';
      } else if (slope > 7) {
        dangerLevel = 'medium';
        dangerColor = 'text-orange-500';
      } else {
        dangerLevel = 'low';
        dangerColor = 'text-amber-500';
      }
    } 
    // 2. Bajadas
    else if (slope < -6) {
      type = 'steepDescent';
      if (slope < -15) {
        dangerLevel = 'high';
        dangerColor = 'text-red-600';
      } else if (slope < -10) {
        dangerLevel = 'medium';
        dangerColor = 'text-orange-500';
      } else {
        dangerLevel = 'low';
        dangerColor = 'text-blue-400';
      }
    }
    // 3. Calor
    else if (wp.weather.temperature > 26 && wp.solarIntensity === 'intense') {
      type = 'heatStress';
      if (wp.weather.temperature > 32) {
        dangerLevel = 'high';
        dangerColor = 'text-red-600';
      } else {
        dangerLevel = 'medium';
        dangerColor = 'text-orange-500';
      }
    }

    if (type) {
      if (!currentSegment || currentSegment.type !== type) {
        if (currentSegment) segments.push(currentSegment);
        currentSegment = {
          type,
          dangerLevel,
          dangerColor,
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
        
        // Upgrade danger level if a steeper part is found
        const levels = ['low', 'medium', 'high'];
        if (levels.indexOf(dangerLevel) > levels.indexOf(currentSegment.dangerLevel)) {
          currentSegment.dangerLevel = dangerLevel;
          currentSegment.dangerColor = dangerColor;
        }
      }
    } else if (currentSegment) {
      segments.push(currentSegment);
      currentSegment = null;
    }
  });

  if (currentSegment) segments.push(currentSegment);
  return segments;
}
