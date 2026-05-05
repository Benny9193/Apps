"""One-shot Wi-Fi scanner.

Wraps the OS's built-in scanner and normalises results to a small record:
SSID, BSSID, channel, signal_dbm, signal_pct, security. Outputs a table
(default), JSON, or CSV.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import platform
import re
import shutil
import subprocess
import sys
from dataclasses import asdict, dataclass


@dataclass
class Network:
    ssid: str
    bssid: str
    channel: int | None
    signal_dbm: int | None
    signal_pct: int | None
    security: str


def _run(cmd: list[str], *, timeout: int = 20) -> str:
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(f"{cmd[0]} not found on PATH") from exc
    if proc.returncode != 0:
        stderr = (proc.stderr or "").strip()
        raise RuntimeError(f"{cmd[0]} exited {proc.returncode}: {stderr}")
    return proc.stdout


def _pct_to_dbm(pct: int) -> int:
    # Microsoft's documented mapping for `netsh` signal %.
    return (pct // 2) - 100


# --- Linux (nmcli) ---------------------------------------------------------

_NMCLI_FIELDS = ["SSID", "BSSID", "CHAN", "SIGNAL", "SECURITY"]


def _split_nmcli_terse(line: str) -> list[str]:
    # nmcli -t separates with ':' and escapes literal ':' as '\:'.
    out: list[str] = []
    buf: list[str] = []
    i = 0
    while i < len(line):
        c = line[i]
        if c == "\\" and i + 1 < len(line):
            buf.append(line[i + 1])
            i += 2
            continue
        if c == ":":
            out.append("".join(buf))
            buf = []
            i += 1
            continue
        buf.append(c)
        i += 1
    out.append("".join(buf))
    return out


def scan_linux(rescan: bool) -> list[Network]:
    if shutil.which("nmcli") is None:
        raise RuntimeError(
            "nmcli not found. Install NetworkManager or use a distro that ships it."
        )
    if rescan:
        subprocess.run(
            ["nmcli", "dev", "wifi", "rescan"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    raw = _run(
        ["nmcli", "-t", "-f", ",".join(_NMCLI_FIELDS), "dev", "wifi", "list"]
    )
    nets: list[Network] = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        parts = _split_nmcli_terse(line)
        if len(parts) < len(_NMCLI_FIELDS):
            continue
        ssid, bssid, chan, signal, security = parts[: len(_NMCLI_FIELDS)]
        try:
            chan_i = int(chan) if chan else None
        except ValueError:
            chan_i = None
        try:
            pct = int(signal) if signal else None
        except ValueError:
            pct = None
        nets.append(
            Network(
                ssid=ssid or "",
                bssid=bssid.upper(),
                channel=chan_i,
                signal_dbm=_pct_to_dbm(pct) if pct is not None else None,
                signal_pct=pct,
                security=security or "--",
            )
        )
    return nets


# --- macOS (airport) -------------------------------------------------------

_AIRPORT_PATH = (
    "/System/Library/PrivateFrameworks/Apple80211.framework"
    "/Versions/Current/Resources/airport"
)
_AIRPORT_BSSID_RE = re.compile(
    r"^(?P<ssid>.*?)\s+(?P<bssid>(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2})\s+"
    r"(?P<rssi>-?\d+)\s+(?P<chan>\S+)\s+\S+\s+\S+\s+(?P<sec>.*)$"
)


def scan_macos() -> list[Network]:
    cmd = _AIRPORT_PATH if shutil.which(_AIRPORT_PATH) else "airport"
    if not shutil.which(cmd):
        raise RuntimeError(
            "airport tool not found. macOS 14+ removed it; consider "
            "`system_profiler SPAirPortDataType` instead."
        )
    raw = _run([cmd, "-s"])
    nets: list[Network] = []
    for line in raw.splitlines()[1:]:  # skip header
        m = _AIRPORT_BSSID_RE.match(line)
        if not m:
            continue
        ssid = m.group("ssid").strip()
        try:
            rssi = int(m.group("rssi"))
        except ValueError:
            rssi = None
        chan_str = m.group("chan").split(",")[0]
        try:
            chan_i = int(chan_str)
        except ValueError:
            chan_i = None
        nets.append(
            Network(
                ssid=ssid,
                bssid=m.group("bssid").upper(),
                channel=chan_i,
                signal_dbm=rssi,
                signal_pct=None,
                security=m.group("sec").strip() or "--",
            )
        )
    return nets


# --- Windows (netsh) -------------------------------------------------------


def scan_windows() -> list[Network]:
    if shutil.which("netsh") is None:
        raise RuntimeError("netsh not found on PATH")
    raw = _run(["netsh", "wlan", "show", "networks", "mode=bssid"])
    nets: list[Network] = []
    cur_ssid: str | None = None
    cur_auth = "--"
    cur_enc = ""
    cur_bssid: str | None = None
    cur_signal_pct: int | None = None
    cur_chan: int | None = None

    def flush() -> None:
        nonlocal cur_bssid, cur_signal_pct, cur_chan
        if cur_bssid is None:
            return
        sec = cur_auth
        if cur_enc and cur_enc.lower() != "none":
            sec = f"{cur_auth}/{cur_enc}"
        nets.append(
            Network(
                ssid=cur_ssid or "",
                bssid=cur_bssid.upper(),
                channel=cur_chan,
                signal_dbm=(
                    _pct_to_dbm(cur_signal_pct) if cur_signal_pct is not None else None
                ),
                signal_pct=cur_signal_pct,
                security=sec,
            )
        )
        cur_bssid = None
        cur_signal_pct = None
        cur_chan = None

    for raw_line in raw.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue
        m = re.match(r"^SSID\s+\d+\s*:\s*(.*)$", line)
        if m:
            flush()
            cur_ssid = m.group(1).strip()
            cur_auth = "--"
            cur_enc = ""
            continue
        m = re.match(r"^\s*Authentication\s*:\s*(.*)$", line)
        if m:
            cur_auth = m.group(1).strip()
            continue
        m = re.match(r"^\s*Encryption\s*:\s*(.*)$", line)
        if m:
            cur_enc = m.group(1).strip()
            continue
        m = re.match(r"^\s*BSSID\s+\d+\s*:\s*(\S+)\s*$", line)
        if m:
            flush()
            cur_bssid = m.group(1)
            continue
        m = re.match(r"^\s*Signal\s*:\s*(\d+)%", line)
        if m:
            cur_signal_pct = int(m.group(1))
            continue
        m = re.match(r"^\s*Channel\s*:\s*(\d+)", line)
        if m:
            cur_chan = int(m.group(1))
            continue
    flush()
    return nets


# --- Output formatting -----------------------------------------------------


def _fmt_table(nets: list[Network]) -> str:
    headers = ["SSID", "BSSID", "CHAN", "RSSI", "SIGNAL", "SECURITY"]
    rows: list[list[str]] = [headers]
    for n in nets:
        rows.append(
            [
                n.ssid or "<hidden>",
                n.bssid,
                str(n.channel) if n.channel is not None else "-",
                f"{n.signal_dbm} dBm" if n.signal_dbm is not None else "-",
                f"{n.signal_pct}%" if n.signal_pct is not None else "-",
                n.security,
            ]
        )
    widths = [max(len(r[i]) for r in rows) for i in range(len(headers))]
    out: list[str] = []
    for idx, row in enumerate(rows):
        out.append("  ".join(c.ljust(widths[i]) for i, c in enumerate(row)).rstrip())
        if idx == 0:
            out.append("  ".join("-" * widths[i] for i in range(len(headers))))
    return "\n".join(out)


def _fmt_csv(nets: list[Network]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["ssid", "bssid", "channel", "signal_dbm", "signal_pct", "security"])
    for n in nets:
        w.writerow(
            [n.ssid, n.bssid, n.channel, n.signal_dbm, n.signal_pct, n.security]
        )
    return buf.getvalue().rstrip("\n")


def _fmt_json(nets: list[Network]) -> str:
    return json.dumps([asdict(n) for n in nets], indent=2)


# --- Entry point -----------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="wifiscan",
        description="One-shot list of nearby Wi-Fi access points.",
    )
    p.add_argument(
        "--format",
        choices=("table", "json", "csv"),
        default="table",
        help="output format (default: table)",
    )
    p.add_argument(
        "--sort",
        choices=("signal", "ssid", "channel", "bssid"),
        default="signal",
        help="sort key (default: signal, strongest first)",
    )
    p.add_argument(
        "--min-signal",
        type=int,
        default=None,
        metavar="DBM",
        help="hide APs weaker than this RSSI in dBm (e.g. -80)",
    )
    p.add_argument(
        "--rescan",
        action="store_true",
        help="force a fresh scan where supported (Linux/nmcli)",
    )
    return p


def _sort_nets(nets: list[Network], key: str) -> list[Network]:
    if key == "ssid":
        return sorted(nets, key=lambda n: (n.ssid.lower(), n.bssid))
    if key == "channel":
        return sorted(nets, key=lambda n: (n.channel is None, n.channel or 0))
    if key == "bssid":
        return sorted(nets, key=lambda n: n.bssid)
    return sorted(
        nets, key=lambda n: (n.signal_dbm is None, -(n.signal_dbm or -999))
    )


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    system = platform.system()
    try:
        if system == "Linux":
            nets = scan_linux(rescan=args.rescan)
        elif system == "Darwin":
            nets = scan_macos()
        elif system == "Windows":
            nets = scan_windows()
        else:
            print(f"wifiscan: unsupported platform: {system}", file=sys.stderr)
            return 2
    except RuntimeError as exc:
        print(f"wifiscan: {exc}", file=sys.stderr)
        return 1

    if args.min_signal is not None:
        nets = [
            n
            for n in nets
            if n.signal_dbm is not None and n.signal_dbm >= args.min_signal
        ]
    nets = _sort_nets(nets, args.sort)

    if args.format == "json":
        print(_fmt_json(nets))
    elif args.format == "csv":
        print(_fmt_csv(nets))
    else:
        print(_fmt_table(nets) if nets else "no networks found")
    return 0


if __name__ == "__main__":
    sys.exit(main())
