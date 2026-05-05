import { useEffect, useState } from "react";
import type { Trip } from "../types";
import { useTracker } from "../lib/useTracker";
import { formatDuration, formatMiles } from "../lib/format";

type Props = {
  onTripSaved: (trip: Trip) => void;
};

export function Tracker({ onTripSaved }: Props) {
  const { state, start, stop, cancel } = useTracker();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (state.status !== "tracking") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  const elapsedMs =
    state.status === "tracking" && state.startedAt !== null
      ? now - state.startedAt
      : 0;

  function handleStop() {
    const trip = stop();
    if (trip && trip.meters > 0) onTripSaved(trip);
  }

  return (
    <section className="tracker">
      <div className="odometer">
        <div className="big">
          {state.status === "tracking" ? formatMiles(state.meters) : "0.00 mi"}
        </div>
        <div className="sub">
          {state.status === "tracking"
            ? formatDuration(elapsedMs)
            : "ready to start"}
        </div>
      </div>

      <div className="signal">
        {state.lastAccuracy === null && state.status === "tracking" && (
          <span className="muted">acquiring GPS…</span>
        )}
        {state.lastAccuracy !== null && (
          <span className={accuracyClass(state.lastAccuracy)}>
            GPS ±{Math.round(state.lastAccuracy)} m
          </span>
        )}
        {state.status === "tracking" && (
          <span className="muted"> · {state.pointCount} fixes</span>
        )}
      </div>

      {state.error && <div className="error">{state.error}</div>}

      <div className="controls">
        {state.status === "idle" ? (
          <button className="primary" onClick={start}>
            Start trip
          </button>
        ) : (
          <>
            <button className="primary" onClick={handleStop}>
              Stop &amp; save
            </button>
            <button className="ghost" onClick={cancel}>
              Cancel
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function accuracyClass(meters: number): string {
  if (meters <= 15) return "ok";
  if (meters <= 50) return "warn";
  return "bad";
}
