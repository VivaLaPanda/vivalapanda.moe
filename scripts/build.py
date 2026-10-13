"""Build the site: compile templates/ with microtemplate, then stamp every local script and stylesheet a page
loads with a hash of its contents (?v=...), so a changed file is fetched fresh and an unchanged one stays cached.

Run: python3 scripts/build.py          (python3 scripts/build.py --check: exit 1 if any page's stamps are stale)
"""
import hashlib
import platform
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TEMPLATES = REPO / "templates"
ASSET = re.compile(r'((?:src|href)="(/(?:js|css)/[^"?]+\.(?:js|css)))(?:\?v(?:ersion)?=[\w]+)?"')


def microtemplate() -> str:
    local = REPO / "microtemplate"   # the committed binary is macOS arm64
    if platform.system() == "Darwin" and local.exists():
        return str(local)
    found = shutil.which("microtemplate") or str(Path.home() / ".local/bin/microtemplate")
    if not Path(found).exists():
        sys.exit("microtemplate not found: see 'microtemplate on Linux' in the README")
    return found


def pages() -> list[Path]:
    return [REPO / t.relative_to(TEMPLATES) for t in TEMPLATES.rglob("*.html") if not t.name.startswith("t_")]


def digest(path: str) -> str:
    return hashlib.sha256((REPO / path.lstrip("/")).read_bytes()).hexdigest()[:10]


def stamped(html: str) -> str:
    return ASSET.sub(lambda m: f'{m.group(1)}?v={digest(m.group(2))}"', html)


def main() -> None:
    check = "--check" in sys.argv
    if not check:
        subprocess.run([microtemplate(), "--out", "../", "--path", "."], cwd=TEMPLATES, check=True,
                       stdout=subprocess.DEVNULL)
    stale = []
    for page in pages():
        html = page.read_text()
        new = stamped(html)
        if new != html:
            stale.append(page.relative_to(REPO))
            if not check:
                page.write_text(new)
    if check and stale:
        sys.exit("stale asset stamps (run python3 scripts/build.py): " + ", ".join(map(str, stale)))
    print(f"{len(pages())} pages built and stamped" if not check else f"{len(pages())} pages: stamps current")


if __name__ == "__main__":
    main()
