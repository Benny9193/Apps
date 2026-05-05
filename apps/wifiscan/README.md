# wifiscan

One-shot CLI to list nearby Wi-Fi access points. Stdlib only — wraps the OS's
built-in scanner and normalises the output.

| Platform | Backend                                       |
| -------- | --------------------------------------------- |
| Linux    | `nmcli -t -f SSID,BSSID,CHAN,SIGNAL,SECURITY dev wifi list` |
| macOS    | `airport -s` (removed in macOS 14+)           |
| Windows  | `netsh wlan show networks mode=bssid`         |

Each row reports SSID, BSSID, channel, RSSI (dBm), signal %, and security.

## Run (without install)

```sh
PYTHONPATH=src python -m wifiscan.cli
```

## Install as a command

```sh
python -m venv .venv && source .venv/bin/activate
pip install -e .
wifiscan
```

## Usage

```sh
wifiscan                       # table, sorted by signal (strongest first)
wifiscan --format json         # JSON array
wifiscan --format csv          # CSV
wifiscan --sort channel        # sort by channel
wifiscan --min-signal -75      # hide APs weaker than -75 dBm
wifiscan --rescan              # force a fresh scan (Linux/nmcli only)
```

## Notes

- `nmcli` reports signal as a percent; wifiscan converts to dBm with the
  `(pct / 2) - 100` mapping (also what `netsh` documents).
- `airport` was removed from macOS 14+. On newer macOS, switch to
  `system_profiler SPAirPortDataType` (not yet wired in).
- Only scan networks you own or have authorisation to scan.

## Layout

- `src/wifiscan/cli.py` — entrypoint (`main()` registered as `wifiscan`)
- `pyproject.toml` — packaging via Hatchling
