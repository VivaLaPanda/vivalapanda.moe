#!/usr/bin/env python3
"""Fetch the house snapshot from rodney's home API and write house/state.json for the living room.

On the server this runs every 5 minutes (see scripts/systemd/house-feed.*). The home API only answers this server
(token + IP allowlist), so visitors never reach the house; they read the static file. A failed fetch keeps the last
good file, marked stale by its "updated" time.

Usage: house_feed.py [OUTPUT_PATH]   (default: house/state.json next to this repo)
"""

import json
import os
import sys
import tempfile
import urllib.request
from pathlib import Path

API_URL = os.environ.get("HOUSE_API_URL", "https://home.vivalapanda.moe/api/house")
TOKEN_FILE = Path(os.environ.get("HOUSE_TOKEN_FILE", "/etc/vivalapanda/house_token"))
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "house" / "state.json"
REQUIRED = {"updated", "local_time", "phase", "lights", "blinds", "climate"}


def fetch() -> dict[str, object]:
    req = urllib.request.Request(API_URL, headers={
        "Authorization": f"Bearer {TOKEN_FILE.read_text().strip()}",
        "User-Agent": "vivalapanda.moe house feed",
    })
    with urllib.request.urlopen(req, timeout=40) as resp:
        data = json.load(resp)
    if not isinstance(data, dict) or not REQUIRED <= data.keys():
        raise ValueError(f"unexpected reply: {str(data)[:200]}")
    return data


def write_atomic(out: Path, data: dict[str, object]) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=out.parent, prefix=".state-", suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, out)


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    data = fetch()
    write_atomic(out, data)
    print(f"wrote {out}: {data['phase']} {data['local_time']}")


if __name__ == "__main__":
    main()
