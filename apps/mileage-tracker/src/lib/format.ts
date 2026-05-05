import { metersToMiles } from "./geo";

export function formatMiles(meters: number, fractionDigits = 2): string {
  return `${metersToMiles(meters).toFixed(fractionDigits)} mi`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString();
}
