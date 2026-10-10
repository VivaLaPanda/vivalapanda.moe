"""Cut the pc-98 fonts into the glyphs the site's pages use (fonts/pc-9800*-core.woff2, ~12KB) and print the
@font-face rules for css/style.css: the core with its unicode-range, the full font (~384KB) for everything else, so
a browser only fetches the full font for a character the core lacks (a new kanji in a hand-edited line still renders).
Rerun after adding text with new kanji, to keep them in the core.
Run: uv run --with fonttools --with brotli python scripts/subset_fonts.py
"""
import subprocess
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = {'pc-98': 'pc-9800', 'pc-98-bold': 'pc-9800-bold'}
# Latin, punctuation, arrows, box drawing and shapes, symbols, CJK punctuation, kana, full/half-width forms
RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2030, 0x203B), (0x2190, 0x21FF), (0x2500, 0x25FF),
          (0x2600, 0x266F), (0x3000, 0x303F), (0x3040, 0x309F), (0x30A0, 0x30FF), (0xFF00, 0xFFEF)]


def site_kanji() -> set[int]:
    files = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
    out: set[int] = set()
    for f in files:
        if not f.endswith(('.html', '.js', '.json', '.css')):
            continue
        out |= {ord(c) for c in (ROOT / f).read_text(encoding='utf-8', errors='ignore') if 0x3400 <= ord(c) <= 0x9FFF}
    return out


def ranges_of(cps: list[int]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    for c in sorted(cps):
        if out and c == out[-1][1] + 1:
            out[-1] = (out[-1][0], c)
        else:
            out.append((c, c))
    return out


def complement(rs: list[tuple[int, int]]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    prev = -1
    for a, b in rs:
        if a > prev + 1:
            out.append((prev + 1, a - 1))
        prev = b
    out.append((prev + 1, 0x10FFFF))
    return out


def css(rs: list[tuple[int, int]]) -> str:
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in rs)


def cut(name: str, want: set[int]) -> None:
    src = ROOT / 'fonts' / f'{name}.woff2'
    core = sorted(set(TTFont(src).getBestCmap()) & want)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    font = TTFont(src)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=core)
    sub.subset(font)
    font.flavor = 'woff2'
    out = ROOT / 'fonts' / f'{name}-core.woff2'
    font.save(out)
    print(f'/* {out.name}: {len(core)} glyphs, {out.stat().st_size} bytes */')


def main() -> None:
    want = {c for a, b in RANGES for c in range(a, b + 1)} | site_kanji()
    # the core's range is all it was cut from, control characters too: a character in it that the font lacks (U+A0)
    # is missing from the full font as well, so sending it to the full font would only cost the download
    core = ranges_of(sorted(want | set(range(0x20)) | set(range(0x7F, 0xA0))))
    for family, name in FONTS.items():
        cut(name, want)
        print(f"@font-face {{\n    font-family: {family};\n    src: url('/fonts/{name}-core.woff2') format('woff2');\n"
              f"    unicode-range: {css(core)};\n}}\n")
        print(f"@font-face {{\n    font-family: {family};\n    src: url('/fonts/{name}.woff2') format('woff2'), "
              f"url('/fonts/{name}.ttf') format('truetype');\n    unicode-range: {css(complement(core))};\n}}\n")


if __name__ == '__main__':
    main()
