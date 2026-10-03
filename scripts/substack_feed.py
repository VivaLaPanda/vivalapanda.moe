#!/usr/bin/env python3
"""Fetch the Substack RSS feed and write a compact posts.json for /blog/.

Substack's feed has no CORS headers, so the browser can't read it directly.
On the server this runs hourly (see scripts/systemd/) and writes into the
webroot; a failed fetch leaves the last good file in place.

Usage: substack_feed.py [OUTPUT_PATH]   (default: blog/posts.json next to this repo)
"""

import html
import json
import os
import re
import sys
import tempfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEED_URL = "https://vlpanda.substack.com/feed"
# unofficial JSON behind the Substack homepage; its pinnedPosts are the "Pin to homepage" posts
HOMEPAGE_URL = "https://vlpanda.substack.com/api/v1/homepage_data"
USER_AGENT = "vivalapanda.moe blog feed (+https://vivalapanda.moe/blog/)"
# Substack's image CDN sends Access-Control-Allow-Origin: *, so pages can read covers into a canvas
THUMB_URL = "https://substackcdn.com/image/fetch/w_600,c_limit,f_png/{}"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "blog" / "posts.json"


# the pc-98 font draws curly quotes as full-width glyphs ("Yglesias’ s"), so use plain ones
QUOTES = str.maketrans({"‘": "'", "’": "'", "‚": "'", "‛": "'", "“": '"', "”": '"', "„": '"'})


def plain_text(s):
    """Feed descriptions are HTML-escaped CDATA; turn them into one line of plain text."""
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip().translate(QUOTES)


def parse(xml_bytes):
    channel = ET.fromstring(xml_bytes).find("channel")
    if channel is None:
        raise ValueError("feed has no <channel>")
    # posts without their own cover get the publication logo as their enclosure
    logo = channel.findtext("image/url")
    posts = []
    for item in channel.findall("item"):
        published = parsedate_to_datetime(item.findtext("pubDate") or "")
        if published is None:
            raise ValueError(f"unparseable pubDate in {item.findtext('link')}")
        enclosure = item.find("enclosure")
        image = enclosure.get("url") if enclosure is not None else None
        if image == logo:
            image = None
        posts.append({
            "title": plain_text(item.findtext("title")),
            "subtitle": plain_text(item.findtext("description")),
            "link": item.findtext("link"),
            "date": published.astimezone(timezone.utc).isoformat(),
            "image": image,
            "thumb": THUMB_URL.format(urllib.parse.quote(image, safe="")) if image else None,
        })
    posts.sort(key=lambda p: p["date"], reverse=True)
    return {
        "title": plain_text(channel.findtext("title")),
        "link": channel.findtext("link"),
        "logo": logo,
        "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "posts": posts,
    }


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def pinned_slugs():
    """Slugs of the posts pinned on the Substack homepage, in pin order.

    The endpoint isn't a documented API, so any failure just means no pins.
    """
    try:
        home = json.loads(fetch(HOMEPAGE_URL))
        return [p["slug"] for p in home.get("pinnedPosts") or [] if p.get("slug")]
    except Exception as err:
        print(f"couldn't read pinned posts, continuing without them: {err}", file=sys.stderr)
        return []


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    data = parse(fetch(FEED_URL))
    if not data["posts"]:
        sys.exit("feed parsed but had no posts; keeping the existing file")

    pins = pinned_slugs()
    for post in data["posts"]:
        slug = urllib.parse.urlparse(post["link"]).path.rstrip("/").rsplit("/", 1)[-1]
        post["pinned"] = pins.index(slug) + 1 if slug in pins else None

    # write-then-rename so readers never see a half-written file
    fd, tmp = tempfile.mkstemp(dir=out.parent, prefix=".posts-", suffix=".json")
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, out)
    print(f"wrote {len(data['posts'])} posts to {out}")


if __name__ == "__main__":
    main()
