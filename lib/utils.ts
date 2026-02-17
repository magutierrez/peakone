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
