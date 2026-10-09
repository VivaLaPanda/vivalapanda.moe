#!/usr/bin/env python3
"""Serve this checkout for dev.vivalapanda.moe (through the Cloudflare tunnel on rodney).

Static files only, like nginx in production. Anything under a dot path (.git, .artifact-staging) and stray logs are
refused, since the tunnel makes this public.

Usage: dev_server.py [PORT]   (default 8080, localhost only)
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HIDDEN_NAMES = {"dl.log"}


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        parts = [p for p in self.path.split("?")[0].split("#")[0].split("/") if p]
        if any(p.startswith(".") or p in HIDDEN_NAMES for p in parts):
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")  # dev: always the working copy
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=str(ROOT)))
    print(f"serving {ROOT} on 127.0.0.1:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
