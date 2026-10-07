#!/usr/bin/env python3
"""Build the recipe book from content/recipes.md.

Writes templates/recipes.html (the index) and templates/recipes/<slug>.html (one page per recipe); microtemplate
then turns those into recipes.html and recipes/<slug>.html like every other page. Run it after editing the
markdown:

    python3 scripts/build_recipes.py && (cd templates && ../microtemplate --out ../ --path .)

The markdown is the export of Panda's recipe doc: `## Course`, then per recipe `### Title`, `**Verdict:** ...`,
a "Serves 6 · ... · Source: ..." line, and `**Section**` headings (Ingredients, Method, Notes, variants...) over
lists, numbered steps, short "Label:" lines and paragraphs. Stdlib only.
"""

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "content" / "recipes.md"
TEMPLATES = ROOT / "templates"

# short, stable URLs; a recipe that isn't listed gets a slug made from its title
SLUGS = {
    "Lamb shepherd's pie": "shepherds-pie",
    "Beef bourguignon": "beef-bourguignon",
    "Reverse-sear tri-tip with pan gravy": "tri-tip",
    "Mustard roast leg of lamb with pan gravy": "mustard-roast-lamb",
    'Tater tot hotdish ("joyslop")': "tater-tot-hotdish",
    "Juniper and gin spatchcock chicken with gin jus": "juniper-gin-chicken",
    "Coq au vin": "coq-au-vin",
    "Lasagna, beef and veggie variants": "lasagna",
    "Creamy potato-fennel soup with bacon": "potato-fennel-soup",
    "Harissa leg of lamb": "harissa-lamb",
    "Warm chickpea, piquillo and preserved lemon salad": "chickpea-salad",
    "Savory skillet cornbread with cheddar and roasted peppers": "skillet-cornbread",
    "Winter pomegranate salad with maple candied walnuts": "pomegranate-salad",
    "Gratin dauphinoise with Gruyère": "gratin-dauphinoise",
    "Smoky chipotle-cheddar polenta": "chipotle-polenta",
    "Crispy baby gold roast potatoes and charred cabbage wedges": "roast-potatoes-and-cabbage",
    "Pickled fennel with star anise": "pickled-fennel",
    "Middle Eastern pickled onions": "pickled-onions",
    "Lemon posset": "lemon-posset",
    "Coconut mango pudding": "coconut-mango-pudding",
    "Holiday rum cake": "rum-cake",
    "Lace cookies": "lace-cookies",
    "Keto lemon panna cotta": "keto-panna-cotta",
}

# where one recipe mentions another, the first mention links to it (never on the recipe's own page)
CROSS_LINKS = [
    ("mustard roast leg of lamb", "mustard-roast-lamb"),
    ("shepherd's pie", "shepherds-pie"),
    ("chickpea salad", "chickpea-salad"),
    ("harissa lamb", "harissa-lamb"),
    ("baby gold potatoes", "roast-potatoes-and-cabbage"),
    ("juniper and gin chicken", "juniper-gin-chicken"),
    ("pickled fennel", "pickled-fennel"),
    ("lace cookies", "lace-cookies"),
    ("tri-tip", "tri-tip"),
]

# hand-written pages from before the recipe doc, listed after the doc's courses
OLDER = [
    ("Buttermilk Pancakes", "pancakes"),
    ("Katsudon", "katsudon"),
]

# the pc-98 font has ½ ¼ ¾ but no thirds or eighths; spell those the way period games did
FRACTIONS = {"⅓": "1/3", "⅔": "2/3", "⅛": "1/8"}


def slugify(title):
    title = re.sub(r"\(.*?\)", "", title).lower().replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", title).strip("-")


def fix_fractions(text):
    for glyph, spelled in FRACTIONS.items():
        text = re.sub(r"(\d)" + glyph, r"\1 " + spelled, text).replace(glyph, spelled)
    return text


def inline(text, links_left):
    """Markdown inline (links, bold) to HTML. links_left: cross-links still to place on this page."""
    text = fix_fractions(text)
    # cross-link the first mention of another recipe, outside existing markdown links
    for phrase, slug in list(links_left):
        parts = re.split(r"(\[[^\]]*\]\([^)]*\))", text)
        for i, part in enumerate(parts):
            if part.startswith("["):
                continue
            m = re.search(re.escape(phrase), part, re.IGNORECASE)
            if m:
                parts[i] = part[:m.start()] + f"[{m.group(0)}](/recipes/{slug}.html)" + part[m.end():]
                links_left.remove((phrase, slug))
                break
        text = "".join(parts)
    out = []
    for i, part in enumerate(re.split(r"(\[[^\]]*\]\([^)]*\))", text)):
        m = re.fullmatch(r"\[([^\]]*)\]\(([^)]*)\)", part)
        if m:
            label, url = html.escape(m.group(1), quote=False), html.escape(m.group(2))
            external = "" if url.startswith("/") else ' target="_blank" rel="noopener"'
            out.append(f'<a href="{url}"{external}>{label}</a>')
        else:
            out.append(html.escape(part, quote=False))
    out = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", "".join(out))
    # the pc-98 font's ° is full-width (JIS); give back half its width so "350°F" reads as one unit
    return out.replace("°", '<span class="deg">°</span>')


def blocks(lines):
    """Split a recipe's lines into blank-line-separated blocks."""
    block = []
    for line in lines:
        if line.strip():
            block.append(line.rstrip())
        elif block:
            yield block
            block = []
    if block:
        yield block


def parse(md):
    intro, courses, course, recipe = [], [], None, None
    for line in md.splitlines():
        if line.startswith("## "):
            course = {"name": line[3:].strip(), "recipes": []}
            courses.append(course)
        elif line.startswith("### "):
            if course is None:
                raise SystemExit(f"recipe before any '## Course' heading: {line}")
            title = line[4:].strip()
            recipe = {"title": title, "slug": SLUGS.get(title) or slugify(title), "lines": []}
            course["recipes"].append(recipe)
        elif recipe:
            recipe["lines"].append(line)
        elif course is None and line.strip() and not line.startswith("# "):
            intro.append(line.strip())
    for course in courses:
        for recipe in course["recipes"]:
            body = list(blocks(recipe.pop("lines")))
            recipe["verdict"] = ""
            if body and body[0][0].startswith("**Verdict:**"):
                recipe["verdict"] = " ".join(body.pop(0))[len("**Verdict:**"):].strip()
            recipe["meta"] = " ".join(body.pop(0)) if body and not body[0][0].startswith(("**", "- ", "1. ")) else ""
            recipe["body"] = body
    # the doc's first line under the title is "date · author"; the intro is the paragraph after it
    return (intro[1:] if len(intro) > 1 else intro), courses


def is_prose(items):
    """Ingredient lists are fragments; notes and variant changes are sentences."""
    return sum(item.endswith(".") for item in items) * 2 >= len(items)


def render_body(body, links_left):
    out, section = [], ""
    for block in body:
        first = block[0]
        if len(block) == 1 and re.fullmatch(r"\*\*(.+)\*\*", first):
            section = first.strip("*")
            out.append(f"<h2>{inline(section, links_left)}</h2>")
        elif all(l.startswith("- ") for l in block):
            items = [l[2:] for l in block]
            cls = ' class="recipe-notes"' if section == "Notes" or is_prose(items) else ""
            out.append(f"<ul{cls}>")
            out += [f"  <li>{inline(item, links_left)}</li>" for item in items]
            out.append("</ul>")
        elif all(re.match(r"\d+\. ", l) for l in block):
            out.append('<ol class="recipe-steps">')
            steps = [re.sub(r"^\d+\. ", "", l) for l in block]
            out += [f"  <li>{inline(step, links_left)}</li>" for step in steps]
            out.append("</ol>")
        elif len(block) == 1 and first.endswith(":") and len(first.split()) <= 4:
            out.append(f"<h5>{inline(first[:-1], links_left)}</h5>")
        else:
            out.append(f"<p>{inline(' '.join(block), links_left)}</p>")
    return out


HEAD = """<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link href="/css/style.css?version=5" rel="stylesheet" type="text/css" media="all">
    <link href="/css/textpage.css?version=4" rel="stylesheet" type="text/css" media="all">
    <link href="/css/recipes.css?version=5" rel="stylesheet" type="text/css" media="all">
  </head>
  <body>
  <div id="audio-player-container">
    <audio id="music" loop preload controls>
      <source src="" id="music-src" crossOrigin="anonymous" type="audio/ogg">
      Your browser does not support the audio element.
    </audio>
  </div>
	<div class="main-container">
		<div class="main-window">
			<div class="subwindow" id="main-image-tall">
"""

FOOT = """      </div>
			{{ template "t_lsidebar.html" . }}
			<div class="subwindow" id="right-sidebar"></div>
		</div>
	</div>
  </body>
</html>
"""

GENERATED = "<!-- generated by scripts/build_recipes.py from content/recipes.md; edit those, not this -->\n"


def indent(lines, n):
    return "\n".join((" " * n + l) if l else "" for l in lines)


def recipe_page(recipe):
    links_left = [(p, s) for p, s in CROSS_LINKS if s != recipe["slug"]]
    body = [f'<a class="recipe-back" href="/recipes.html">← Recipe book</a>',
            f"<h1>{inline(recipe['title'], [])}</h1>", "", "<hr>", ""]
    if recipe["verdict"]:
        body.append(f'<p class="recipe-verdict"><b>Verdict:</b> {inline(recipe["verdict"], links_left)}</p>')
    if recipe["meta"]:
        body.append(f'<p class="recipe-meta">{inline(recipe["meta"], links_left)}</p>')
    body += render_body(recipe["body"], links_left)
    return (HEAD.format(title=f"{html.escape(recipe['title'])} · Panda's Recipe Book") + GENERATED
            + '        <div id="talltext" class="recipe-page">\n' + indent(body, 10) + "\n        </div>\n" + FOOT)


def index_page(intro, courses):
    body = ["<h1>Panda's Recipe Book</h1>", ""]
    if intro:
        body.append(f'<p class="recipe-intro">{inline(" ".join(intro), [])}</p>')
    body += ["", "<hr>"]

    def row(href, title, verdict, extra=""):
        line = f'<span class="recipe-verdict-line">{inline(verdict, [])}</span>' if verdict else ""
        return ["  <li>", f'    <a href="{href}"{extra}>', f'      <span class="recipe-title">{title}</span>'] \
            + ([f"      {line}"] if line else []) + ["    </a>", "  </li>"]

    for course in courses:
        body += ["", f'<div class="recipe-section">{html.escape(course["name"])}</div>', '<ul class="recipe-index">']
        for r in course["recipes"]:
            body += row(f"/recipes/{r['slug']}.html", inline(r["title"], []), r["verdict"])
        body.append("</ul>")
    body += ["", '<div class="recipe-section">Older recipes</div>', '<ul class="recipe-index">']
    for title, slug in OLDER:
        body += row(f"/recipes/{slug}.html", title, "")
    body += ["</ul>", "",
             "<!-- other people's recipe books: ⇒ rows open in a new tab (the pc-98 font has no ↗) -->",
             '<div class="recipe-section">Elsewhere</div>', '<ul class="recipe-index recipe-elsewhere">',
             "  <li>", '    <a href="https://venki.com/recipes" target="_blank" rel="noopener">',
             '      <span class="recipe-title">Venki\'s recipes</span>',
             '      <span class="recipe-host">venki.com</span>', "    </a>", "  </li>", "</ul>"]
    return (HEAD.format(title="Panda's Recipe Book") + GENERATED
            + '        <div id="talltext">\n' + indent(body, 10) + "\n        </div>\n" + FOOT)


def main():
    intro, courses = parse(SOURCE.read_text(encoding="utf-8"))
    out = TEMPLATES / "recipes"
    out.mkdir(exist_ok=True)
    slugs = [r["slug"] for c in courses for r in c["recipes"]]
    assert len(slugs) == len(set(slugs)), "two recipes share a slug"
    assert not set(slugs) & {s for _, s in OLDER}, "a recipe would overwrite a hand-written page"
    for course in courses:
        for recipe in course["recipes"]:
            (out / f"{recipe['slug']}.html").write_text(recipe_page(recipe), encoding="utf-8")
    (TEMPLATES / "recipes.html").write_text(index_page(intro, courses), encoding="utf-8")
    print(f"{len(slugs)} recipes in {len(courses)} courses -> templates/recipes/, templates/recipes.html")


if __name__ == "__main__":
    main()
