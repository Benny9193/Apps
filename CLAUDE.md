# Repo conventions

This is a monorepo of small standalone apps.

## Layout

- `apps/<name>/` — each app lives in its own directory and is self-contained.
  Apps may have wildly different stacks; do not assume a shared toolchain.
- `templates/<stack>/` — starter scaffolds. Treat these as read-only; copy them
  into `apps/` rather than editing in place.
- `scripts/new-app.sh` — copies a template into `apps/<name>`.

## Adding a new app

```sh
scripts/new-app.sh <template> <name>
# e.g.
scripts/new-app.sh web-react todo-list
```

Available templates: `web-react`, `static-site`, `node-api`, `python-cli`.
Each template has its own `README.md` with run instructions and its own
`.gitignore` for tooling artifacts (kept per-template since the ignore lists
differ by stack).

## Working inside an app

Always `cd apps/<name>` before running install/build/test commands. Each app
owns its lockfile, its node_modules / venv, and its own scripts. Don't hoist
dependencies to the repo root — keeping apps self-contained is the point.

## Adding a new template

Drop a new directory under `templates/`. It should include:

- a runnable hello-world entry point,
- a `README.md` with run/build commands,
- a `.gitignore` for that stack's build artifacts.

Keep templates small — they are starting points, not frameworks.
