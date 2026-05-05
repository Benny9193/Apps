import { useEffect, useState } from "react";
import type { Trip } from "./types";
import { loadTrips, saveTrips } from "./lib/storage";
import { Tracker } from "./components/Tracker";
import { TripList } from "./components/TripList";

export function App() {
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips());

  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  function addTrip(trip: Trip) {
    setTrips((prev) => [trip, ...prev]);
  }

  function deleteTrip(id: string) {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="page">
      <header className="app-header">
        <h1>Mileage tracker</h1>
      </header>
      <Tracker onTripSaved={addTrip} />
      <TripList trips={trips} onDelete={deleteTrip} />
      <footer className="app-footer">
        <p className="muted small">
          GPS works in the browser, but background tracking is unreliable. Keep
          this tab open and the screen on during a trip.
        </p>
      </footer>
    </div>
  );
}
