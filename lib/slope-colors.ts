export function getSlopeColorHex(slope: number): string {
  const absSlope = Math.abs(slope);
  if (absSlope <= 1) return '#10b981';
  if (absSlope < 5) return '#f59e0b';
  if (absSlope < 10) return '#ef4444';
  return '#991b1b';
}
