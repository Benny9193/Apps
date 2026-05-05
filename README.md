# Apps

Monorepo of small standalone apps.

## Structure

```
apps/                Each app lives in its own self-contained directory.
templates/           Starter scaffolds. Copy into apps/ rather than editing in place.
  web-react/           Vite + React + TypeScript SPA
  static-site/         Plain HTML/CSS/JS, no build step
  node-api/            Express + TypeScript HTTP API
  python-cli/          Python CLI (argparse, packaged with Hatchling)
scripts/
  new-app.sh         Copy a template into apps/<name>.
```

## Start a new app

```sh
scripts/new-app.sh <template> <name>
# e.g.
scripts/new-app.sh web-react todo-list
cd apps/todo-list
cat README.md
```

Each template's `README.md` has its own run/build instructions.
