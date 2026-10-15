"""General checks for every Explore place, on a desktop and a phone viewport.

- page errors and console errors/warnings
- every text page and menu fits its box and the screen (walks each menu choice and each object one level down)
- every click zone (hotspot or play-hit) is mostly reachable (not under another zone or an overlay) and
  no zone covers so much of the picture that it hides what else is there
- home menus with too many choices
- the link graph (exits, and choices that go somewhere): targets exist, every place has a way out, everything
  is reachable from Main Street
- every page's asset stamps are current (scripts/build.py --check)
- every "action" in dialogue.json has code; warns about "play" lines no code reads

Run: uv run --with playwright tests/explore_check.py [base-url] [place ...]
(first time: uv run --with playwright playwright install chromium)
"""
import json
import re
from collections import Counter
import subprocess
import sys
from queue import Empty, Queue
from threading import Thread
from dataclasses import dataclass, field
from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright

REPO = Path(__file__).resolve().parent.parent
VIEWPORTS = {"desktop": (1280, 860), "phone": (390, 844)}
MAX_CHOICES = 5
WORKERS = 8
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
    return f"{base}/explore/explore.html?loc={place}"


# ---------- the link graph (static) ----------

def link_graph() -> dict[str, list[str]]:
    src = (REPO / "js/explore-locations.js").read_text()
    parts = re.split(r'\n    "(\w+)": \{', src)
    graph = {}
    for name, body in zip(parts[1::2], parts[2::2]):
        links = re.search(r"links: \[(.*?)\n        \]", body, re.S)
        targets = re.findall(r'to: "([^"]+)"', links.group(1)) if links else []
        graph[name] = [t for t in (target_place(t) for t in targets) if t]
    dialogue = json.loads((REPO / "data/dialogue.json").read_text())["explore"]
    for name in graph:   # a choice that takes you somewhere ("go") is a way too
        graph[name] += [t for t in (target_place(g) for g in gos(dialogue.get(name))) if t]
    return graph


def gos(x: object) -> list[str]:
    if isinstance(x, dict):
        return ([x["go"]] if isinstance(x.get("go"), str) else []) + [g for v in x.values() for g in gos(v)]
    if isinstance(x, list):
        return [g for v in x for g in gos(v)]
    return []


def target_place(to: str) -> str | None:
    m = re.fullmatch(r"\?loc=(\w+)", to)
    return m.group(1) if m else None   # anything else leaves Explore (another page of the site, or outside)


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
    gated = {"casinolounge", "backpassage", "oldhouse", "catroom", "bar25"}   # reached by a door that opens in play
    out += [f"graph: {k} not reachable from mainstreet by links" for k in graph if k not in seen and k not in gated]
    return out


def check_duplicate_ways() -> list[str]:
    """A place never has two ways (map links or "go" choices) to the same destination."""
    src = (REPO / "js/explore-locations.js").read_text()
    dialogue = json.loads((REPO / "data/dialogue.json").read_text())["explore"]
    parts = re.split(r'\n    "(\w+)": \{', src)
    out = []
    for name, body in zip(parts[1::2], parts[2::2]):
        links = re.search(r"links: \[(.*?)\n        \]", body, re.S)
        ways = (re.findall(r'to: "([^"]+)"', links.group(1)) if links else []) + gos(dialogue.get(name))
        out += [f"graph: {name} has {n} ways to {to}" for to, n in Counter(ways).items() if n > 1]
    return out


def check_actions() -> tuple[list[str], list[str]]:
    """Every "action" a choice names has code (S.actions.<name>); warns about "play" lines no code reads."""
    dialogue = json.loads((REPO / "data/dialogue.json").read_text())
    code = "\n".join(p.read_text() for p in (REPO / "js").glob("*.js"))
    defined = set(re.findall(r"actions\.(\w+) =", code))
    named: set[str] = set()

    def walk(x: object) -> None:
        if isinstance(x, dict):
            if isinstance(x.get("action"), str):
                named.add(x["action"])
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)

    walk(dialogue)
    fails = [f"dialogue: action {a!r} has no code (S.actions.{a})" for a in sorted(named - defined)]
    unread = [f"explore.{k}.play.{key}" for k, v in dialogue["explore"].items() if isinstance(v, dict)
              for key in v.get("play") or {} if not re.search(rf"\b{key}\b", code)]
    unread += [f"explore.lines.{key}" for key in dialogue["explore"].get("lines", {}) if not re.search(rf"\b{key}\b", code)]
    return fails, [f"no code reads {u}" for u in unread]


def check_stamps() -> list[str]:
    run = subprocess.run([sys.executable, str(REPO / "scripts/build.py"), "--check"], capture_output=True, text=True)
    return [] if run.returncode == 0 else [run.stderr.strip() or run.stdout.strip()]


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
    idle = 0
    for _ in range(160):   # 8s at most
        pg.wait_for_timeout(50)
        if c := choices(pg):
            fits(pg, where + " (menu)", res, vp)
            return c
        if pg.is_visible("#text-arrow"):
            idle = 0
            fits(pg, where, res, vp)
            pg.click("#text-box", position={"x": 30, "y": 15})
        else:
            idle += 1
            if idle > 8 and pg.evaluate("(document.getElementById('room-text') || {}).textContent"):
                return []   # a line with nothing after it: the idle room
    return choices(pg)


def click_choice(pg: Page, label: str, base: str, place: str) -> bool:
    """Click a choice; False if it took us off the page (a link out, a place change)."""
    try:
        pg.locator("#room-choices .room-choice", has_text=label).first.click(timeout=1500, no_wait_after=True)
    except Exception:
        return False
    pg.wait_for_timeout(150)
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


def page(browser: Browser, size: tuple[int, int], base: str, errs: list[str], motion: str) -> Page:
    ctx = browser.new_context(viewport={"width": size[0], "height": size[1]}, reduced_motion=motion)
    ctx.route("**/house/api/**", lambda r: r.fulfill(status=503, body="{}"))   # never mint real house keys
    ctx.route(re.compile(r"\.(mp3|mp4|ogg|m4a|wav)(\?|$)"), lambda r: r.abort())   # the music isn't under test
    pg = ctx.new_page()
    noise = KNOWN_NOISE + (() if base == PROD else DEV_ONLY)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type in ("error", "warning") and not any(n in m.text for n in noise)
          and errs.append(m.text))
    return pg


def check_place(browser: Browser, base: str, place: str) -> Result:
    res = Result(place)
    for vp, size in VIEWPORTS.items():
        errs: list[str] = []
        # zones with everything moving (an animated overlay could block clicks)
        pg = page(browser, size, base, errs, "no-preference")
        load(pg, url(base, place))
        settle(pg, "greeting", Result(place), vp)
        check_zones(pg, res, vp)
        pg.context.close()
        # the words with reduced motion, so lines appear at once instead of typing out
        pg = page(browser, size, base, errs, "reduce")
        load(pg, url(base, place))
        home = settle(pg, "greeting", res, vp)
        if vp == "desktop" and len(home) > MAX_CHOICES:
            res.warnings.append(f"{len(home)} choices at home: {home}")
        for label in home[:MAX_CHOICES + 3]:
            load(pg, url(base, place))
            if label not in settle(pg, "greeting", Result(place), vp):
                continue
            if not click_choice(pg, label, base, place):
                continue   # it left the page
            for sub in settle(pg, label, res, vp):   # one level further: the first new choice
                if sub not in home:
                    if click_choice(pg, sub, base, place):
                        settle(pg, f"{label} > {sub}", res, vp)
                    break
        check_objects(pg, base, place, res, vp)
        pg.context.close()
        res.problems += [f"{vp}: {e}" for e in dict.fromkeys(errs)]
    return res


def check_objects(pg: Page, base: str, place: str, res: Result, vp: str) -> None:
    """Click each thing in the picture that isn't a way out, read what it says, and take its first choice (a game)."""
    load(pg, url(base, place))
    settle(pg, "greeting", Result(place), vp)
    ids = pg.eval_on_selector_all(".room-hotspot", "es => es.map(e => e.dataset.id).filter(i => !/^exit/.test(i))")
    for oid in ids:
        load(pg, url(base, place))
        settle(pg, "greeting", Result(place), vp)
        try:
            pg.locator(f".room-hotspot[data-id='{oid}']").dispatch_event("click")
        except Exception:
            continue
        got = settle(pg, f"object {oid}", res, vp)
        if got and click_choice(pg, got[0], base, place):
            settle(pg, f"object {oid} > {got[0]}", res, vp)


def load(pg: Page, where: str) -> None:
    """Go to a page; a choice that goes somewhere may still be navigating, so try again once it has."""
    for attempt in range(3):
        try:
            pg.goto(where, wait_until="domcontentloaded")
            return
        except Exception:
            if attempt == 2:
                raise
            pg.wait_for_timeout(500)


def worker(base: str, todo: "Queue[str]", out: list[Result]) -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        while True:
            try:
                place = todo.get_nowait()
            except Empty:
                break
            try:
                out.append(check_place(browser, base, place))
            except Exception as e:   # report it and carry on with the other places
                out.append(Result(place, problems=[f"the check itself failed: {str(e).splitlines()[0]}"]))
        browser.close()


def main() -> None:
    args = sys.argv[1:]
    base = args.pop(0).rstrip("/") if args and args[0].startswith("http") else "https://dev.vivalapanda.moe"
    todo = args or places()
    action_fails, unread = check_actions()
    problems = check_graph() + check_duplicate_ways() + check_stamps() + action_fails
    for w in unread:
        print(f"warn {w}")
    queue: Queue[str] = Queue()
    for k in todo:
        queue.put(k)
    results: list[Result] = []
    threads = [Thread(target=worker, args=(base, queue, results)) for _ in range(min(WORKERS, len(todo)))]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    for res in sorted(results, key=lambda r: todo.index(r.place)):
        problems += [f"{res.place}: {p}" for p in dict.fromkeys(res.problems)]
        for w in res.warnings:
            print(f"warn {res.place}: {w}")
    for p in problems:
        print("FAIL", p)
    print(f"{len(todo)} places, {len(problems)} problems")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
