import type { Trip } from "../types";
import { formatDateTime, formatDuration, formatMiles } from "../lib/format";
import { downloadCsv, tripsToCsv } from "../lib/csv";

type Props = {
  trips: Trip[];
  onDelete: (id: string) => void;
};

export function TripList({ trips, onDelete }: Props) {
  const totalMeters = trips.reduce((sum, t) => sum + t.meters, 0);

  function handleExport() {
    const csv = tripsToCsv(trips);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`mileage-${stamp}.csv`, csv);
  }

  if (trips.length === 0) {
    return (
      <section className="trips empty">
        <h2>Trips</h2>
        <p className="muted">No trips yet. Start one above.</p>
      </section>
    );
  }

  return (
    <section className="trips">
      <header className="trips-header">
        <h2>
          Trips <span className="count">({trips.length})</span>
        </h2>
        <div className="trips-actions">
          <span className="muted">Total: {formatMiles(totalMeters)}</span>
          <button className="ghost" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </header>

      <ul className="trip-list">
        {trips.map((t) => (
          <li key={t.id} className="trip">
            <div className="trip-main">
              <div className="trip-date">{formatDateTime(t.startedAt)}</div>
              <div className="trip-stats">
                <strong>{formatMiles(t.meters)}</strong>
                <span className="muted"> · {formatDuration(t.endedAt - t.startedAt)}</span>
              </div>
            </div>
            <button
              className="ghost danger"
              onClick={() => {
                if (confirm("Delete this trip?")) onDelete(t.id);
              }}
              aria-label="Delete trip"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
