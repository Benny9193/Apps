import { useEffect, useRef, useState } from "react";
import { haversineMeters, type LatLon } from "./geo";
import type { Trip } from "../types";

// Drop fixes worse than this — GPS jitter would inflate distance.
const MIN_ACCURACY_METERS = 50;
// Increments smaller than this are probably noise while standing still.
const MIN_STEP_METERS = 5;

export type TrackerStatus = "idle" | "tracking";

export type TrackerState = {
  status: TrackerStatus;
  startedAt: number | null;
  meters: number;
  pointCount: number;
  lastAccuracy: number | null;
  error: string | null;
};

const initialState: TrackerState = {
  status: "idle",
  startedAt: null,
  meters: 0,
  pointCount: 0,
  lastAccuracy: null,
  error: null,
};

export function useTracker() {
  const [state, setState] = useState<TrackerState>(initialState);

  // Refs are the source of truth so stop() can't read stale render state
  // if a watchPosition callback fires between the last render and the click.
  const watchId = useRef<number | null>(null);
  const lastPoint = useRef<LatLon | null>(null);
  const startedAt = useRef<number | null>(null);
  const meters = useRef(0);
  const pointCount = useRef(0);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  function start(): void {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Geolocation is not supported on this device." }));
      return;
    }
    lastPoint.current = null;
    startedAt.current = Date.now();
    meters.current = 0;
    pointCount.current = 0;
    setState({
      status: "tracking",
      startedAt: startedAt.current,
      meters: 0,
      pointCount: 0,
      lastAccuracy: null,
      error: null,
    });
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy;
        if (accuracy > MIN_ACCURACY_METERS) {
          setState((s) => ({ ...s, lastAccuracy: accuracy }));
          return;
        }
        const point: LatLon = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        if (lastPoint.current) {
          const step = haversineMeters(lastPoint.current, point);
          if (step >= MIN_STEP_METERS) {
            meters.current += step;
            lastPoint.current = point;
          }
        } else {
          lastPoint.current = point;
        }
        pointCount.current += 1;
        setState((s) => ({
          ...s,
          meters: meters.current,
          pointCount: pointCount.current,
          lastAccuracy: accuracy,
        }));
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message }));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30_000 },
    );
  }

  function stop(): Trip | null {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (startedAt.current === null) {
      setState(initialState);
      return null;
    }
    const trip: Trip = {
      id: crypto.randomUUID(),
      startedAt: startedAt.current,
      endedAt: Date.now(),
      meters: meters.current,
      pointCount: pointCount.current,
    };
    startedAt.current = null;
    meters.current = 0;
    pointCount.current = 0;
    lastPoint.current = null;
    setState(initialState);
    return trip;
  }

  function cancel(): void {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    startedAt.current = null;
    meters.current = 0;
    pointCount.current = 0;
    lastPoint.current = null;
    setState(initialState);
  }

  return { state, start, stop, cancel };
}
