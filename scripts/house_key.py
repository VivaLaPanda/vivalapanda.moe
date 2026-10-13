#!/usr/bin/env python3
"""Panda's house key: visitors who find it can switch a few things in the living room on and off.

Runs on the server behind nginx (`location ^~ /house/api/`), Python standard library only:

  POST /house/api/key  {"route": "pc", "password": "..."}  the bedroom PC's login: the real password, or an SQL
                                                           injection (a real query on a throwaway in-memory table)
                       {"route": "lake", "words": [4 words]} the Explore hunt's four favours, dropped in the pond
                       -> {"key": "<token>"} | {"error": "..."} | {"sql": "<the error, query and all>"}
  POST /house/api/act  X-House-Key: <token>; {"device": "<name>", "on": true|false}
                       -> forwarded to rodney's /api/house/act (write token), then house/state.json is refreshed

Keys never expire (Panda's call). Each is "<route>.<id>.<signature>", signed with the config's secret; revoke one
by adding its id to "revoked", or all by changing "secret". Kill switch: touch /etc/vivalapanda/house_writes_off
(rodney has its own: `home-mcp house-write-token --off`). Every key issued and every action is logged with the
visitor's key id and IP to /var/log/vivalapanda/house_keys.jsonl.

Usage: house_key.py serve
       house_key.py set-password < file      (the PC password: one line)
       house_key.py set-hunt WORD WORD WORD WORD
"""

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional, Tuple

import house_feed  # same directory: the feed's fetch and atomic write

ETC = Path(os.environ.get("HOUSE_ETC", "/etc/vivalapanda"))
CONFIG = ETC / "house_keys.json"
WRITE_TOKEN = ETC / "house_write_token"
WRITES_OFF = ETC / "house_writes_off"
LOG = Path(os.environ.get("HOUSE_KEY_LOG", "/var/log/vivalapanda/house_keys.jsonl"))
STATE = Path(__file__).resolve().parent.parent / "house" / "state.json"
ACT_URL = os.environ.get("HOUSE_ACT_URL", "https://home.vivalapanda.moe/api/house/act")
PORT = int(os.environ.get("HOUSE_KEY_PORT", "8791"))

# what a key may switch: the living room's lamps, blinds (on = open) and the AC (rodney checks the same list)
DEVICES = {"Corner Table Lamp", "Windowside Table", "Dining Room Light", "The Sun",
           "Living Room Blinds", "Dining Room Blinds", "Air Conditioner"}
ROUTES = {"pc", "sql", "lake"}
PBKDF2_ITERS = 200_000
MAX_BODY = 2048
MAX_PASSWORD = 80
REFRESH_AFTER_S = (65,)      # re-read the house after an action, once rodney's 60s cache has turned over
# (window seconds, max requests) per bucket
LIMITS = {"key_ip": (600, 30), "act_key": (600, 20), "act_ip": (600, 30), "act_all": (600, 60)}
ACT_GAP_S = 3.0             # one key's actions at least this far apart

SQL_QUERY = "SELECT * FROM users WHERE name='panda' AND pass='{}'"


# ---------- config ----------

def load_config() -> Dict[str, Any]:
    if CONFIG.exists():
        return json.loads(CONFIG.read_text())
    return {"secret": secrets.token_hex(32), "revoked": []}


def save_config(cfg: Dict[str, Any]) -> None:
    ETC.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG.with_suffix(".tmp")
    tmp.write_text(json.dumps(cfg, indent=1))
    os.chmod(tmp, 0o600)
    os.replace(tmp, CONFIG)


def hunt_hash(words: List[str]) -> str:
    return hashlib.sha256(" ".join(sorted(w.strip().lower() for w in words)).encode()).hexdigest()


def password_ok(cfg: Dict[str, Any], password: str) -> bool:
    p = cfg.get("password")
    if not p:
        return False
    got = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(p["salt"]), p["iters"]).hex()
    return hmac.compare_digest(got, p["hash"])


# ---------- keys ----------

def sign(cfg: Dict[str, Any], body: str) -> str:
    return hmac.new(bytes.fromhex(cfg["secret"]), body.encode(), hashlib.sha256).hexdigest()[:32]


def new_key(cfg: Dict[str, Any], route: str) -> Tuple[str, str]:
    kid = secrets.token_hex(4)
    body = f"{route}.{kid}"
    return f"{body}.{sign(cfg, body)}", kid


def check_key(cfg: Dict[str, Any], token: str) -> Optional[Tuple[str, str]]:
    """(route, id) for a good key; None for anything else."""
    parts = token.split(".")
    if len(parts) != 3 or parts[0] not in ROUTES:
        return None
    route, kid, sig = parts
    if not hmac.compare_digest(sig, sign(cfg, f"{route}.{kid}")) or kid in cfg.get("revoked", []):
        return None
    return route, kid


# ---------- the PC's login ----------

def sql_login(password: str) -> Tuple[bool, Optional[str]]:
    """The login program's query, really run, as badly as it was written: (got a row, error text).

    The table is in memory and holds one row whose password is random, so only an injection gets a row. A single
    statement can only read; function calls are refused so nothing can burn memory or time."""
    if re.search(r"\w\s*\(", password):
        return False, None
    query = SQL_QUERY.format(password)
    db = sqlite3.connect(":memory:")
    try:
        db.execute("CREATE TABLE users (name TEXT, pass TEXT)")
        db.execute("INSERT INTO users VALUES ('panda', ?)", (secrets.token_hex(16),))
        db.set_progress_handler(lambda: 1, 20_000)   # abort anything long-running
        return db.execute(query).fetchone() is not None, None
    except (sqlite3.Error, sqlite3.Warning) as e:
        return False, f"SQL ERROR: {e}\n{query}"
    finally:
        db.close()


# ---------- limits and log ----------

@dataclass
class Limiter:
    hits: Dict[str, Deque[float]] = field(default_factory=lambda: defaultdict(deque))
    last_act: Dict[str, float] = field(default_factory=dict)
    lock: threading.Lock = field(default_factory=threading.Lock)

    def allow(self, *buckets: Tuple[str, str]) -> bool:
        """All of (limit name, who) under their limits? Counts the request in each only if so."""
        now = time.monotonic()
        with self.lock:
            for name, who in buckets:
                window, most = LIMITS[name]
                q = self.hits[f"{name}:{who}"]
                while q and now - q[0] > window:
                    q.popleft()
                if len(q) >= most:
                    return False
            for name, who in buckets:
                self.hits[f"{name}:{who}"].append(now)
            return True

    def act_gap_ok(self, kid: str) -> bool:
        now = time.monotonic()
        with self.lock:
            if now - self.last_act.get(kid, -1e9) < ACT_GAP_S:
                return False
            self.last_act[kid] = now
            return True


LIMITER = Limiter()
LOG_LOCK = threading.Lock()


def log(**entry: Any) -> None:
    entry = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), **entry}
    line = json.dumps(entry)
    print(line, flush=True)   # the journal too
    try:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG_LOCK, LOG.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError as e:
        print(f"couldn't write {LOG}: {e}", file=sys.stderr)


# ---------- actions ----------

def forward(device: str, on: bool, actor: str) -> int:
    """POST to rodney; its HTTP status (0 when unreachable)."""
    req = urllib.request.Request(
        ACT_URL, method="POST",
        data=json.dumps({"device": device, "on": on, "actor": actor}).encode(),
        headers={"Authorization": f"Bearer {WRITE_TOKEN.read_text().strip()}", "Content-Type": "application/json",
                 "User-Agent": "vivalapanda.moe house key"})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except (urllib.error.URLError, OSError):
        return 0


def refresh_later() -> None:
    def run() -> None:
        start = time.monotonic()
        for at in REFRESH_AFTER_S:
            time.sleep(max(0.0, at - (time.monotonic() - start)))
            try:
                house_feed.write_atomic(STATE, house_feed.fetch())
            except Exception as e:  # the minute timer will catch up
                print(f"refresh failed: {e}", file=sys.stderr)
    threading.Thread(target=run, daemon=True).start()


# ---------- HTTP ----------

class Handler(BaseHTTPRequestHandler):
    server_version = "house-key"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002 - the base class's name
        pass   # requests are logged by log() where they matter

    def ip(self) -> str:
        return self.headers.get("X-Real-IP") or self.client_address[0]

    def reply(self, status: int, body: Dict[str, Any]) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def body(self) -> Optional[Dict[str, Any]]:
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_BODY:
            return None
        try:
            got = json.loads(self.rfile.read(n))
        except ValueError:
            return None
        return got if isinstance(got, dict) else None

    def do_POST(self) -> None:  # noqa: N802 - http.server's name
        body = self.body()
        if body is None:
            self.reply(400, {"error": "bad request"})
        elif self.path == "/house/api/key":
            self.key(body)
        elif self.path == "/house/api/act":
            self.act(body)
        else:
            self.reply(404, {"error": "not found"})

    def grant(self, cfg: Dict[str, Any], route: str) -> None:
        token, kid = new_key(cfg, route)
        log(event="key", route=route, key=kid, ip=self.ip())
        self.reply(200, {"key": token})

    def key(self, body: Dict[str, Any]) -> None:
        if not LIMITER.allow(("key_ip", self.ip())):
            self.reply(429, {"error": "slow down"})
            return
        cfg = load_config()
        route = body.get("route")
        if route == "pc":
            password = body.get("password")
            if not isinstance(password, str) or not password or len(password) > MAX_PASSWORD:
                self.reply(401, {"error": "denied"})
            elif password_ok(cfg, password):
                self.grant(cfg, "pc")
            else:
                row, error = sql_login(password)
                if row:
                    self.grant(cfg, "sql")
                elif error:
                    self.reply(400, {"sql": error})
                else:
                    self.reply(401, {"error": "denied"})
        elif route == "lake":
            words = body.get("words")
            ok = (isinstance(words, list) and len(words) == 4 and all(isinstance(w, str) for w in words)
                  and cfg.get("hunt_sha256") and hmac.compare_digest(hunt_hash(words), cfg["hunt_sha256"]))
            if ok:
                self.grant(cfg, "lake")
            else:
                self.reply(401, {"error": "denied"})
        else:
            self.reply(400, {"error": "bad request"})

    def act(self, body: Dict[str, Any]) -> None:
        cfg = load_config()
        held = check_key(cfg, self.headers.get("X-House-Key", ""))
        device, on = body.get("device"), body.get("on")
        if held is None:
            self.reply(403, {"error": "no key"})
            return
        route, kid = held
        if device not in DEVICES or not isinstance(on, bool):
            self.reply(400, {"error": "bad request"})
            return
        if WRITES_OFF.exists():
            log(event="act", key=kid, route=route, ip=self.ip(), device=device, on=on, outcome="writes off")
            self.reply(503, {"error": "off"})
            return
        if not LIMITER.act_gap_ok(kid) or not LIMITER.allow(("act_key", kid), ("act_ip", self.ip()), ("act_all", "")):
            self.reply(429, {"error": "slow down"})
            return
        status = forward(device, on, f"key {kid} ({route})")
        log(event="act", key=kid, route=route, ip=self.ip(), device=device, on=on, outcome=status)
        if status == 200:
            refresh_later()
            self.reply(200, {"ok": True})
        elif status == 429:
            self.reply(429, {"error": "slow down"})
        elif status == 403:
            self.reply(503, {"error": "off"})   # rodney's kill switch (or a token mix-up)
        else:
            self.reply(502, {"error": "the house didn't answer"})


# ---------- CLI ----------

def main() -> None:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "serve"
    if cmd == "serve":
        if not CONFIG.exists():
            save_config(load_config())   # a fresh secret on first start
        ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
    elif cmd == "set-password":
        password = sys.stdin.readline().strip()
        if len(password) < 16:
            sys.exit("use a long password (16+ characters)")
        cfg = load_config()
        salt = secrets.token_bytes(16)
        cfg["password"] = {"salt": salt.hex(), "iters": PBKDF2_ITERS,
                           "hash": hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERS).hex()}
        save_config(cfg)
        print("PC password set")
    elif cmd == "set-hunt" and len(sys.argv) == 6:
        cfg = load_config()
        cfg["hunt_sha256"] = hunt_hash(sys.argv[2:])
        save_config(cfg)
        print("hunt words set")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
