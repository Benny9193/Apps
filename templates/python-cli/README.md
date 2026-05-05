# python-cli

Python CLI scaffold (stdlib `argparse`, no runtime deps).

## Run (without install)

```sh
python -m app.cli --name you
# or
PYTHONPATH=src python -m app.cli --name you
```

## Install as a command

```sh
python -m venv .venv && source .venv/bin/activate
pip install -e .
app --name you
```

## Layout

- `src/app/cli.py` — entrypoint (`main()` registered as the `app` console script)
- `pyproject.toml` — packaging via Hatchling
