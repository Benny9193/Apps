# mileage-tracker

GPS-based mileage tracker. PWA built with Vite + React + TypeScript. Trips are
stored in `localStorage` on the device — no backend, no account.

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the production bundle
npm run typecheck
```

## How tracking works

- Uses `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.
- Distance is the sum of haversine segments between consecutive fixes.
- Fixes worse than ±50 m accuracy are dropped (reduces drift).
- Steps shorter than 5 m are ignored (reduces standing-still jitter).

## Testing on a phone

Geolocation requires HTTPS in production browsers. `localhost` is exempt for
desktop testing, but to load the dev server on a phone over LAN you need HTTPS.
Easiest paths:

- `npm run build && npm run preview -- --host` and tunnel it with
  `ngrok http 4173`, then open the ngrok HTTPS URL on your phone.
- Or deploy `dist/` to any static host that gives you HTTPS (Netlify, Vercel,
  Cloudflare Pages, GitHub Pages).

When prompted, allow location access. iOS Safari may also prompt for "precise"
vs "approximate" — choose precise.

## Background tracking caveats

Browsers throttle `watchPosition` heavily when the tab isn't visible:

- iOS Safari pauses GPS as soon as the screen locks or you switch apps.
- Android Chrome typically throttles to occasional updates.

For real background tracking you need a native app. For now, **keep the screen
on and the tab in front during a trip**. (Android: Chrome > site settings >
allow location all the time. iOS: there is no setting that fixes this.)

## Layout

- `src/main.tsx` — entry, registers the service worker in production
- `src/App.tsx` — composes Tracker + TripList; persists to localStorage
- `src/components/Tracker.tsx` — start/stop UI, live odometer
- `src/components/TripList.tsx` — saved trips, delete, CSV export
- `src/lib/useTracker.ts` — `watchPosition` hook with filtering
- `src/lib/geo.ts` — haversine + meter/mile conversion
- `src/lib/storage.ts` — versioned localStorage (`mileage-tracker:trips:v1`)
- `src/lib/csv.ts` — CSV serialization + browser download
- `src/lib/format.ts` — distance / duration / date formatting
- `public/manifest.webmanifest`, `public/sw.js`, `public/icon.svg` — PWA assets

## CSV format

`id,started_at_iso,ended_at_iso,duration_seconds,distance_miles,distance_meters,point_count`
