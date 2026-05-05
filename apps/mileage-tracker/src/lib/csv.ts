import type { Trip } from "../types";
import { metersToMiles } from "./geo";

const HEADERS = [
  "id",
  "started_at_iso",
  "ended_at_iso",
  "duration_seconds",
  "distance_miles",
  "distance_meters",
  "point_count",
];

export function tripsToCsv(trips: Trip[]): string {
  const rows = trips.map((t) => [
    t.id,
    new Date(t.startedAt).toISOString(),
    new Date(t.endedAt).toISOString(),
    Math.round((t.endedAt - t.startedAt) / 1000).toString(),
    metersToMiles(t.meters).toFixed(3),
    t.meters.toFixed(2),
    t.pointCount.toString(),
  ]);
  return [HEADERS, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
