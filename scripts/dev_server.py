#!/usr/bin/env python3
"""Serve this checkout for dev.vivalapanda.moe (through the Cloudflare tunnel on rodney).

The tunnel makes this public, so it serves only what production would: files tracked in git, plus the feed files
the server generates (gitignored). Anything else in the working tree (downloads, logs, .artifact-staging) is a 404,
and there are no directory listings.

Usage: dev_server.py [PORT]   (default 8080, localhost only)
"""

import subprocess
import sys
import time
import urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GENERATED = {"reading/books.json", "blog/posts.json", "house/state.json"}  # written by the feed scripts; gitignored
REFRESH_S = 10


class Tracked:
    """The set of servable paths, re-read from git every few seconds so new commits show up."""

    def __init__(self) -> None:
        self.paths: set[str] = set()
        self.at = 0.0

    def get(self) -> set[str]:
        if time.monotonic() - self.at > REFRESH_S:
            out = subprocess.run(["git", "-C", str(ROOT), "ls-files", "-z"], capture_output=True, check=True).stdout
            paths = {p for p in out.decode().split("\0") if p} | GENERATED
            self.paths = paths
            self.at = time.monotonic()
        return self.paths


TRACKED = Tracked()


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        rel = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).strip("/")
        paths = TRACKED.get()
        index = f"{rel}/index.html" if rel else "index.html"
        if rel not in paths and index not in paths:
            self.send_error(404)
            return None
        return super().send_head()  # a folder with a tracked index.html redirects to "/" and serves it

    def list_directory(self, path):
        self.send_error(404)
        return None

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
