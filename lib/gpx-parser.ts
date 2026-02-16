import type { RoutePoint, GPXData } from './types';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGPX(gpxString: string): GPXData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, 'text/xml');

  const nameEl = doc.querySelector('trk > name') || doc.querySelector('metadata > name');
  const name = nameEl?.textContent || 'Ruta sin nombre';

  const trkpts = doc.querySelectorAll('trkpt');
  const points: RoutePoint[] = [];
  let totalDistance = 0;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  let prevEle: number | undefined;

  trkpts.forEach((trkpt, i) => {
    const lat = parseFloat(trkpt.getAttribute('lat') || '0');
    const lon = parseFloat(trkpt.getAttribute('lon') || '0');
    const eleEl = trkpt.querySelector('ele');
    const ele = eleEl ? parseFloat(eleEl.textContent || '0') : undefined;

    if (i > 0) {
      const prevPoint = points[i - 1];
      const dist = haversineDistance(prevPoint.lat, prevPoint.lon, lat, lon);
      totalDistance += dist;

      if (ele !== undefined && prevEle !== undefined) {
        const eleDiff = ele - prevEle;
        if (eleDiff > 0) totalElevationGain += eleDiff;
        else totalElevationLoss += Math.abs(eleDiff);
      }
    }

    if (ele !== undefined) prevEle = ele;

    points.push({
      lat,
      lon,
      ele,
      distanceFromStart: totalDistance,
    });
  });

  // If no trackpoints, try waypoints
  if (points.length === 0) {
    const wpts = doc.querySelectorAll('wpt');
    wpts.forEach((wpt, i) => {
      const lat = parseFloat(wpt.getAttribute('lat') || '0');
      const lon = parseFloat(wpt.getAttribute('lon') || '0');
      const eleEl = wpt.querySelector('ele');
      const ele = eleEl ? parseFloat(eleEl.textContent || '0') : undefined;

      if (i > 0) {
        const prevPoint = points[i - 1];
        const dist = haversineDistance(prevPoint.lat, prevPoint.lon, lat, lon);
        totalDistance += dist;
      }

      points.push({ lat, lon, ele, distanceFromStart: totalDistance });
    });
  }

  // Also check route points (rte > rtept)
  if (points.length === 0) {
    const rtepts = doc.querySelectorAll('rtept');
    rtepts.forEach((rtept, i) => {
      const lat = parseFloat(rtept.getAttribute('lat') || '0');
      const lon = parseFloat(rtept.getAttribute('lon') || '0');
      const eleEl = rtept.querySelector('ele');
      const ele = eleEl ? parseFloat(eleEl.textContent || '0') : undefined;

      if (i > 0) {
        const prevPoint = points[i - 1];
        const dist = haversineDistance(prevPoint.lat, prevPoint.lon, lat, lon);
        totalDistance += dist;
      }

      points.push({ lat, lon, ele, distanceFromStart: totalDistance });
    });
  }

  return {
    points,
    name,
    totalDistance,
    totalElevationGain,
    totalElevationLoss,
  };
}

export function reverseGPXData(data: GPXData): GPXData {
  const reversedPoints = [...data.points].reverse();
  const totalDist = data.totalDistance;

  // Recalculate distances from the new start
  const points = reversedPoints.map((p) => ({
    ...p,
    distanceFromStart: totalDist - p.distanceFromStart,
  }));

  return {
    ...data,
    points,
    totalElevationGain: data.totalElevationLoss,
    totalElevationLoss: data.totalElevationGain,
  };
}

// Decode Google Polyline algorithm
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function stravaToGPXData(activity: any): GPXData {
  if (!activity.map?.summary_polyline) {
    throw new Error('No path data in activity');
  }

  const coords = decodePolyline(activity.map.summary_polyline);
  const points: RoutePoint[] = [];
  let totalDistance = 0;

  coords.forEach((coord, i) => {
    if (i > 0) {
      const prev = coords[i - 1];
      totalDistance += haversineDistance(prev[0], prev[1], coord[0], coord[1]);
    }
    points.push({
      lat: coord[0],
      lon: coord[1],
      distanceFromStart: totalDistance,
    });
  });

  return {
    points,
    name: activity.name,
    totalDistance: activity.distance / 1000, // Strava is in meters
    totalElevationGain: activity.total_elevation_gain,
    totalElevationLoss: 0, // Strava doesn't provide it in summary
  };
}

export function stravaRouteToGPXData(route: any): GPXData {
  const polyline = route.map?.polyline || route.map?.summary_polyline;
  if (!polyline) {
    throw new Error('No path data in route');
  }

  const coords = decodePolyline(polyline);
  const points: RoutePoint[] = [];
  let totalDistance = 0;

  coords.forEach((coord, i) => {
    if (i > 0) {
      const prev = coords[i - 1];
      totalDistance += haversineDistance(prev[0], prev[1], coord[0], coord[1]);
    }
    points.push({
      lat: coord[0],
      lon: coord[1],
      distanceFromStart: totalDistance,
    });
  });

  return {
    points,
    name: route.name,
    totalDistance: route.distance / 1000,
    totalElevationGain: route.elevation_gain,
    totalElevationLoss: 0,
  };
}

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function getWindEffect(
  travelBearing: number,
  windDirection: number,
): { effect: 'tailwind' | 'headwind' | 'crosswind-left' | 'crosswind-right'; angle: number } {
  // Wind direction is where wind COMES FROM, so wind blowing TO is windDirection + 180
  const windTo = (windDirection + 180) % 360;
  let angleDiff = windTo - travelBearing;
  if (angleDiff < -180) angleDiff += 360;
  if (angleDiff > 180) angleDiff -= 360;

  const absAngle = Math.abs(angleDiff);

  if (absAngle <= 45) {
    return { effect: 'tailwind', angle: absAngle };
  } else if (absAngle >= 135) {
    return { effect: 'headwind', angle: 180 - absAngle };
  } else if (angleDiff > 0) {
    return { effect: 'crosswind-right', angle: absAngle };
  } else {
    return { effect: 'crosswind-left', angle: absAngle };
  }
}

export function sampleRoutePoints(points: RoutePoint[], numSamples: number = 20): RoutePoint[] {
  if (points.length <= numSamples) return points;

  const totalDist = points[points.length - 1].distanceFromStart;
  const interval = totalDist / (numSamples - 1);
  const sampled: RoutePoint[] = [points[0]];

  let targetDist = interval;
  for (let i = 1; i < numSamples - 1; i++) {
    const closest = points.reduce((prev, curr) =>
      Math.abs(curr.distanceFromStart - targetDist) < Math.abs(prev.distanceFromStart - targetDist)
        ? curr
        : prev,
    );
    sampled.push(closest);
    targetDist += interval;
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}
