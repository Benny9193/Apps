import type { Trip } from "../types";

const KEY = "mileage-tracker:trips:v1";

export function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTrip);
  } catch {
    return [];
  }
}

export function saveTrips(trips: Trip[]): void {
  localStorage.setItem(KEY, JSON.stringify(trips));
}

function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.startedAt === "number" &&
    typeof t.endedAt === "number" &&
    typeof t.meters === "number" &&
    typeof t.pointCount === "number"
  );
}
