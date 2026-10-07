#!/usr/bin/env python3
"""Fetch Panda's Goodreads shelves and write a compact books.json for /reading/.

Goodreads closed its API to new keys in 2020, but every public shelf still has an RSS feed. On the server this runs
hourly (see scripts/systemd/) and writes into the webroot; a failed fetch leaves the last good file in place.

Usage: goodreads_feed.py [OUTPUT_PATH]   (default: reading/books.json next to this repo)
"""

import html
import json
import os
import re
import sys
import tempfile
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

USER_ID = "29012397"
PROFILE_URL = f"https://www.goodreads.com/user/show/{USER_ID}-vivalapanda"
# the to-read shelf is left out on purpose: it hasn't changed since 2015
SHELVES = ["currently-reading", "read"]
FEED_URL = "https://www.goodreads.com/review/list_rss/{user}?shelf={shelf}&per_page=100&page={page}"
USER_AGENT = "vivalapanda.moe reading list (+https://vivalapanda.moe/reading/)"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "reading" / "books.json"

# the pc-98 font draws curly quotes as full-width glyphs, so use plain ones
QUOTES = str.maketrans({"‘": "'", "’": "'", "‚": "'", "‛": "'", "“": '"', "”": '"', "„": '"'})
# "Martin the Warrior (Redwall, #6)" -> title "Martin the Warrior", series "Redwall, #6"
SERIES = re.compile(r"^(.*?)\s*\(([^()]*#[^()]*)\)\s*$")


def plain_text(s):
    s = re.sub(r"<br\s*/?>", "\n", s or "", flags=re.IGNORECASE)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).translate(QUOTES)
    return "\n".join(re.sub(r"[ \t]+", " ", line).strip() for line in s.splitlines()).strip()


def when(text):
    """RSS dates ("Wed, 07 Aug 2024 ...") to an ISO date, or None when the field is empty."""
    text = (text or "").strip()
    return parsedate_to_datetime(text).astimezone(timezone.utc).date().isoformat() if text else None


def book(item):
    get = lambda tag: (item.findtext(tag) or "").strip()
    title, series = get("title").translate(QUOTES), None
    m = SERIES.match(title)
    if m:
        title, series = m.group(1), m.group(2)
    return {
        "id": get("book_id"),
        "title": title,
        "series": series,
        "author": get("author_name").translate(QUOTES),
        "link": f"https://www.goodreads.com/book/show/{get('book_id')}",
        "review_link": get("link"),
        # i.gr-assets.com sends Access-Control-Allow-Origin: *, so the page can run covers through the PC-98 filter
        "cover": get("book_medium_image_url") or get("book_image_url"),
        "cover_large": get("book_large_image_url") or get("book_medium_image_url"),
        "rating": int(get("user_rating") or 0),
        "read": when(get("user_read_at")),
        "added": when(get("user_date_added")),
        "review": plain_text(get("user_review")),
    }


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def shelf(name):
    books, page = [], 1
    while True:
        channel = ET.fromstring(fetch(FEED_URL.format(user=USER_ID, shelf=name, page=page))).find("channel")
        if channel is None:
            raise ValueError(f"{name} feed has no <channel>")
        items = channel.findall("item")
        books += [book(item) for item in items]
        if len(items) < 100:
            return books
        page += 1
        time.sleep(1)


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    shelves = {name: shelf(name) for name in SHELVES}
    if not shelves["read"]:
        sys.exit("the read shelf came back empty; keeping the existing file")
    # newest first: by date read where there is one, otherwise by when the book was added
    for books in shelves.values():
        books.sort(key=lambda b: (b["read"] or "", b["added"] or ""), reverse=True)
    data = {
        "profile": PROFILE_URL,
        "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "shelves": shelves,
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=out.parent, prefix=".books-", suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, out)
    counts = ", ".join(f"{len(b)} {name}" for name, b in shelves.items())
    print(f"wrote {out}: {counts}")


if __name__ == "__main__":
    main()
