export function progressColor(percent: number): string {
  const hue = Math.round(percent * 1.2); // 0 (red) → 120 (green)
  return `hsl(${hue}, 85%, 55%)`;
}
