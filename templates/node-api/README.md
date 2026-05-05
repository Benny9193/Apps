# node-api

Express + TypeScript HTTP API.

## Run

```sh
npm install
npm run dev        # http://localhost:3000 (auto-reload via tsx watch)
npm run build      # compiles to dist/
npm start          # runs dist/server.js
npm run typecheck
```

## Routes

- `GET /` — banner JSON
- `GET /health` — `{ ok: true }`

Set `PORT` to override the default `3000`.
