"""General checks for every Explore place, on a desktop and a phone viewport.

- page errors and console errors/warnings
- every text page and menu fits its box and the screen (walks each menu choice one level down)
- every click zone (hotspot or play-hit) is mostly reachable (not under another zone or an overlay) and
  no zone covers so much of the picture that it hides what else is there
- home menus with too many choices
- the link graph: targets exist, every place has a way out, everything is reachable from Main Street

Run: uv run --with playwright tests/explore_check.py [base-url] [place ...]
(first time: uv run --with playwright playwright install chromium)
"""
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

REPO = Path(__file__).resolve().parent.parent
SPECIAL = {"frontdesk", "penthouse", "towerbar", "nightresidential_girl"}   # places with their own page
VIEWPORTS = {"desktop": (1280, 860), "phone": (390, 844)}
MAX_CHOICES = 5
MIN_REACHABLE = 0.4
MAX_AREA = 0.4   # of the picture, for one zone
KNOWN_NOISE = ("Failed to load resource", "youtube", "YouTube")
PROD = "https://vivalapanda.moe"
DEV_ONLY = ("blocked by CORS policy",)   # dev calls prod APIs that only allow prod


@dataclass
class Result:
    place: str
    problems: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def places() -> list[str]:
    return re.findall(r'^    "(\w+)": \{', (REPO / "js/explore-locations.js").read_text(), re.M)


def url(base: str, place: str) -> str:
    return f"{base}/explore/{place}.html" if place in SPECIAL else f"{base}/explore/explore.html?loc={place}"


# ---------- the link graph (static) ----------

def link_graph() -> dict[str, list[str]]:
    src = (REPO / "js/explore-locations.js").read_text()
    parts = re.split(r'\n    "(\w+)": \{', src)
    graph = {}
    for name, body in zip(parts[1::2], parts[2::2]):
        links = re.search(r"links: \[(.*?)\n        \]", body, re.S)
        targets = re.findall(r'to: "([^"]+)"', links.group(1)) if links else []
        graph[name] = [t for t in (target_place(t) for t in targets) if t]
    return graph


def target_place(to: str) -> str | None:
    if m := re.search(r"loc=(\w+)", to):
        return m.group(1)
    if m := re.fullmatch(r"(\w+)\.html", to):
        return "mainstreet" if m.group(1) == "explore" else m.group(1)
    return None   # leaves Explore (another page of the site, or outside)


def check_graph() -> list[str]:
    graph, out = link_graph(), []
    for k, ts in graph.items():
        out += [f"graph: {k} links to unknown place {t}" for t in ts if t not in graph]
    seen, todo = set(), ["mainstreet"]
    while todo:
        k = todo.pop()
        if k in seen or k not in graph:
            continue
        seen.add(k)
        todo += graph[k]
    gated = {"zengarden", "casinolounge", "backpassage", "oldhouse", "catroom", "bar25", "garage", "gallery"}   # reached by a door that opens in play
    out += [f"graph: {k} not reachable from mainstreet by links" for k in graph if k not in seen and k not in gated]
    return out


# ---------- in the browser ----------

FIT_JS = """() => {
    const b = document.getElementById('text-box');
    if (!b) return { over: false, off: false, text: '' };
    const r = b.getBoundingClientRect();
    return { over: b.scrollHeight > b.clientHeight + 2, off: r.bottom > innerHeight + 1 || r.right > innerWidth + 1,
             text: document.getElementById('room-text').textContent.slice(0, 60) };
}"""

ZONES_JS = """([minShare, maxShare]) => {
    const zones = [...document.querySelectorAll('.room-hotspot, .play-hit')], bad = [];
    const art = document.getElementById('room-art').getBoundingClientRect(), artArea = art.width * art.height;
    const isZone = e => e && (e.classList.contains('room-hotspot') || e.classList.contains('play-hit'));
    for (const z of zones) {
        const r = z.getBoundingClientRect();
        let inside = 0, mine = 0, blocker = '';
        for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++) {
            const x = r.left + r.width * i / 10, y = r.top + r.height * j / 10;
            if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
            const stack = document.elementsFromPoint(x, y);
            if (!stack.includes(z)) continue;   // outside the polygon
            inside++;
            if (stack[0] === z) mine++;
            else if (!blocker) blocker = isZone(stack[0]) ? (stack[0].getAttribute('aria-label') || stack[0].dataset.id)
                                                          : stack[0].tagName + '.' + stack[0].className;
        }
        const name = z.getAttribute('aria-label') || z.dataset.id;
        if (inside / 81 * r.width * r.height > maxShare * artArea)   // one zone swallowing the scene hides what's behind it
            bad.push(`${name}: covers ${Math.round(100 * inside / 81 * r.width * r.height / artArea)}% of the picture`);
        if (!inside) bad.push(name + ': off screen or empty');
        else if (mine / inside < minShare) bad.push(`${name}: only ${Math.round(100 * mine / inside)}% clickable (under ${blocker})`);
    }
    return bad;
}"""


def choices(pg: Page) -> list[str]:
    return pg.eval_on_selector_all("#room-choices .room-choice", "es => es.map(e => e.textContent)")


def fits(pg: Page, where: str, res: Result, vp: str) -> None:
    f = pg.evaluate(FIT_JS)
    if f["over"] or f["off"]:
        res.problems.append(f"{vp}: text {'overflows its box' if f['over'] else 'runs off screen'} at {where}: {f['text']!r}")


def settle(pg: Page, where: str, res: Result, vp: str) -> list[str]:
    """Click through text pages (checking each fits) until a menu or the idle room."""
    try:
        return walk(pg, where, res, vp)
    except Exception:   # a click took us somewhere else mid-walk
        return []


def walk(pg: Page, where: str, res: Result, vp: str) -> list[str]:
    for _ in range(30):
        pg.wait_for_timeout(200)
        if c := choices(pg):
            fits(pg, where + " (menu)", res, vp)
            return c
        if pg.is_visible("#text-arrow"):
            fits(pg, where, res, vp)
            pg.click("#text-box", position={"x": 30, "y": 15})
        elif not pg.evaluate("(document.getElementById('room-text') || {}).textContent"):
            return []
    return choices(pg)


def click_choice(pg: Page, label: str, base: str, place: str) -> bool:
    """Click a choice; False if it took us off the page (a link out, a place change)."""
    try:
        pg.locator("#room-choices .room-choice", has_text=label).first.click(timeout=1500, no_wait_after=True)
    except Exception:
        return False
    pg.wait_for_timeout(300)
    return pg.url == url(base, place)


def check_zones(pg: Page, res: Result, vp: str) -> None:
    res.problems += [f"{vp}: zone {b}" for b in pg.evaluate(ZONES_JS, [MIN_REACHABLE, MAX_AREA])]
    for _ in range(3):   # panoramas (the casino): look along and check each view
        right = pg.query_selector(".play-hit[aria-label='Look right']")
        if not right:
            break
        right.click()
        pg.wait_for_timeout(900)
        res.problems += [f"{vp}: zone (panned) {b}" for b in pg.evaluate(ZONES_JS, [MIN_REACHABLE, MAX_AREA])]


def check_place(base: str, place: str) -> Result:
    res = Result(place)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for vp, size in VIEWPORTS.items():
            ctx = browser.new_context(viewport={"width": size[0], "height": size[1]})
            ctx.route("**/house/api/**", lambda r: r.fulfill(status=503, body="{}"))   # never mint real house keys
            pg = ctx.new_page()
            errs: list[str] = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            noise = KNOWN_NOISE + (() if base == PROD else DEV_ONLY)
            pg.on("console", lambda m: m.type in ("error", "warning") and not any(n in m.text for n in noise)
                  and errs.append(m.text))
            pg.goto(url(base, place), wait_until="networkidle")
            home = settle(pg, "greeting", res, vp)
            if vp == "desktop" and len(home) > MAX_CHOICES:
                res.warnings.append(f"{len(home)} choices at home: {home}")
            check_zones(pg, res, vp)
            for label in home[:MAX_CHOICES + 3]:
                pg.goto(url(base, place), wait_until="networkidle")
                if label not in settle(pg, "greeting", Result(place), vp):
                    continue
                if not click_choice(pg, label, base, place):
                    continue   # it left the page
                for sub in settle(pg, label, res, vp):   # one level further: the first new choice
                    if sub not in home:
                        if click_choice(pg, sub, base, place):
                            settle(pg, f"{label} > {sub}", res, vp)
                        break
            res.problems += [f"{vp}: {e}" for e in dict.fromkeys(errs)]
            ctx.close()
        browser.close()
    return res


def main() -> None:
    args = sys.argv[1:]
    base = args.pop(0).rstrip("/") if args and args[0].startswith("http") else "https://dev.vivalapanda.moe"
    todo = args or places()
    problems = check_graph()
    with ThreadPoolExecutor(6) as pool:
        for res in pool.map(lambda k: check_place(base, k), todo):
            problems += [f"{res.place}: {p}" for p in dict.fromkeys(res.problems)]
            for w in res.warnings:
                print(f"warn {res.place}: {w}")
    for p in problems:
        print("FAIL", p)
    print(f"{len(todo)} places, {len(problems)} problems")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
