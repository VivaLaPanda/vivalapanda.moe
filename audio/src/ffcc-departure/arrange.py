"""PC-98 (YM2608/OPNA) arrange of "Departure" (Final Fantasy Crystal Chronicles, Kumi Tanioka).

Writes departure-pc98.mid: one MIDI channel per OPNA voice.
  ch0 FM1 lead        ch1 FM2 lead double / harmony   ch2 FM3 bass
  ch3 FM4 harp        ch4 FM5 pad                     ch5 FM6 pad
  ch6 SSG1 echo       ch7 SSG2 arpeggio               ch8 SSG3 pedal / octave double
  ch9 OPNA rhythm (36 BD, 38 SD, 37 rim, 42 HH, 46 open HH, 49 top cymbal, 45/48 toms,
      47/50 hand drum with upward bend)
Program numbers pick render.py patches.

Notes come from the piano reduction by Cerulean Pictures (VGMusic "dparture.mid"),
checked against the OST recording; bars 1-65 of the original form one loop.
Run: uv run --with mido python arrange.py
"""
from dataclasses import dataclass
from pathlib import Path

import mido

BPM = 112
TPB = 480
STEP = TPB // 4  # one 16th
BAR = 16
N_BARS = 65
OUT = Path(__file__).with_name("departure-pc98.mid")

NAMES = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}

# Quantized piano reduction (pos16:note:dur16) for the bars that are not repeats.
PIANO_LH = {
    1: "0:D2:6 6:D2:2 8:D3:8",
    2: "0:D2:6 6:D2:2 8:D3:4 12:D2:4",
    3: "0:D2:6 6:D2:2 8:D3:8",
    4: "0:D2:6 6:D2:2 8:D3:4 12:D2:4",
    5: "0:D2:2 2:D3:6 2:A3:6 8:D2:2 10:D3:6 10:A3:6",
    6: "0:D2:2 2:D3:6 2:A3:6 8:D2:2 10:D3:6 10:A3:6",
    7: "0:D2:2 0:D3:2 2:D2:2 2:D3:2 6:D4:2 8:D2:2 8:D3:2 10:D2:2 10:D3:2 14:E4:2",
    8: "0:G2:2 2:G2:2 4:B3:2 6:G3:2 8:G2:2 10:G2:2 12:D4:2 14:B3:2",
    9: "0:A#2:2 2:A#2:2 4:D4:2 6:A#3:2 8:C3:2 10:C3:2 12:E4:2 14:C4:2",
    10: "0:G2:2 2:G2:2 4:B3:2 6:G3:2 8:G2:2 10:G2:2 12:D4:2 14:B3:2",
    11: "0:A#2:2 2:A#2:2 4:D4:2 6:A#3:2 8:C3:2 10:C3:2 12:C4:2 14:A3:2",
    12: "0:D2:2 2:D3:2 4:A3:2 6:F#3:2 8:D2:2 8:D3:2 10:A3:6",
    21: "0:D#3:2 2:D#3:2 2:G3:2 4:D4:2 6:A#3:2 8:D#3:2 10:D#3:2 10:G3:2 12:D4:2 14:A#3:2",
    22: "0:A#2:2 2:A#2:2 4:C4:2 6:A#3:2 8:A#2:2 10:A#2:2 12:C4:2 14:A#3:2",  # C4 per the OST, not D4
    23: "0:B2:2 2:B2:2 4:D4:2 6:B3:2 8:B2:2 10:B2:2 12:D4:2 14:B3:2",
    24: "0:E3:2 2:E3:2 4:D4:2 6:B3:2 8:E3:2 10:E3:2 12:D4:2 14:B3:2",
    29: "0:A2:2 2:A2:2 4:D4:2 6:A3:2 8:A2:2 10:A2:2 12:C#4:2 14:A3:2",
    30: "0:A#2:2 2:A#2:2 4:C4:2 6:A#3:2 8:A#2:2 10:A#2:2 12:D4:2 14:A#3:2",
    31: "0:C3:2 2:C3:2 4:D4:2 6:C4:2 8:C3:2 10:C3:2 12:D4:2 14:C4:2",
    32: "0:D2:2 0:D3:2 2:D3:2 2:A3:2 4:E4:2 6:D4:2 8:D2:2 8:D3:2 10:D3:2 10:A3:2 12:E4:2 14:D4:2",
    33: "0:D2:16",
    42: "0:D3:2 0:A3:2 2:A3:2 4:F4:2 6:D4:2 10:C4:2 12:G4:2 14:E4:2",
    43: "0:D3:2 0:A3:2 2:A3:2 4:A4:2 6:F4:2 10:A3:2 12:F4:2 14:D4:2",
    44: "0:D3:2 0:A3:2 2:A3:2 4:F4:2 6:D4:2 10:C4:2 12:G4:2 14:E4:2",
    45: "0:D3:2 0:G3:2 0:B3:2 2:G3:2 4:B3:2 6:G3:2 10:G3:2 12:D4:2 14:B3:2",
    46: "0:F3:2 0:A#3:2 2:F3:2 4:D4:2 6:A#3:2 8:C3:2 10:G3:2 12:E4:2 14:C4:2",
    47: "0:G2:2 0:D3:2 2:D3:2 4:B3:2 6:G3:2 10:G3:2 12:D4:2 14:B3:2",
    48: "0:F3:2 0:A#3:2 2:F3:2 4:D4:2 6:A#3:2 8:C3:2 10:E3:2 12:C4:2 14:A3:2",
    49: "0:D3:2 2:D3:2 4:A3:2 6:F#3:2 8:D3:2 10:A3:6",
    50: "0:D3:2 0:A3:2 2:D3:2 4:F4:2 6:D4:2 8:D3:2 10:C4:2 12:G4:2 14:E4:2",
    51: "0:D3:2 0:A3:2 2:A3:2 4:A4:2 6:F4:2 8:D3:2 10:D3:2 12:F4:2 14:D4:2",
    52: "0:D3:2 0:A3:2 2:D3:2 4:F4:2 6:D4:2 8:D3:2 10:C4:2 12:G4:2 14:E4:2",
    53: "0:G2:2 2:G2:2 4:B3:2 6:G3:2 8:G2:2 10:G2:2 12:D4:2 14:B3:2",
    54: "0:A#2:2 2:A#2:2 4:D4:2 6:A#3:2 8:C3:2 10:C3:2 12:E4:2 14:C4:2",
    55: "0:G2:2 2:G2:2 4:B3:2 6:G3:2 8:G2:2 10:G2:2 12:D4:2 14:B3:2",
    56: "0:A#2:2 2:A#2:2 4:D4:2 6:A#3:2 8:C3:2 10:C3:2 12:C4:2 14:A3:2",
    57: "0:D2:2 2:D3:2 4:A3:2 6:F#3:2 8:D2:2 8:D3:2 10:A3:6",
}
# Bars that repeat earlier ones in the original.
REPEAT = {**{b: b - 8 for b in range(13, 21)}, **{b: b - 4 for b in range(25, 28)},
          **{b: b - 29 for b in range(34, 42)}, **{b: b - 53 for b in range(58, 66)}}
PIANO_LH[28] = PIANO_LH[24]

# Melodies, sequential "note:dur16" tokens; r = rest.
RIFF = "A4:4 F4:2 D5:2 C5:2 C4:2 G4:2 A#4:2 | A4:4 A4:2 A#4:2 A4:4 F4:2 D4:2"
INTRO_HARP = "A4:4 D4:2 D4:4 A3:2 D4:2 A3:2 | D4:8 A3:2 A3:2 A3:4"
A_MEL = ("F5:6 A5:2 E5:6 G5:2 | G5:8 D5:8 | F5:6 D5:2 E5:6 C5:2 | D5:8 D5:8 | "
         "F5:6 G5:2 E5:6 C5:2 | D5:12 r:4")
A_HARM = ("D5:6 F5:2 A4:6 C5:2 | B4:8 B4:8 | A#4:6 A#4:2 A4:6 A4:2 | G4:8 G4:8 | "
          "A#4:6 D5:2 A4:6 A4:2 | A4:12 r:4")
B_MEL = ("D5:6 C5:2 F5:6 D5:2 | A4:6 A#4:2 C5:6 D5:2 | E5:6 F5:2 G5:6 A5:2 | E5:6 F5:2 D5:8 | "
         "D5:6 C5:2 F5:6 D5:2 | A4:6 A#4:2 C5:6 D5:2 | E5:6 F5:2 G5:6 A5:2 | E5:6 F5:2 G5:6 D5:2 | "
         "E5:16 | D5:16 | E5:16 | D5:16")
# Inner voice of the piano under the B melody: a pedal that follows the melody rhythm.
B_HARM = ("G4:6 G4:2 G4:6 G4:2 | F4:6 F4:2 F4:6 F4:2 | A4:6 A4:2 A4:6 A4:2 | G#4:6 G#4:2 G#4:8 | "
          "G4:6 G4:2 G4:6 G4:2 | F4:6 F4:2 F4:6 F4:2 | A4:6 A4:2 A4:6 A4:2 | G#4:6 G#4:2 G#4:6 G#4:2 | "
          "G4:16 | A#4:16 | C5:16 | A4:16")
C_MEL = ("r:4 E5:2 D5:2 E5:12 F5:2 G5:2 E5:12 F5:2 G5:2 A5:8 | G5:12 A5:2 G5:2 | "
         "F5:7 G5:1 E5:6 C5:2 | D5:8 D5:4 F5:2 G5:2 | A5:4 D5:2 E5:1 F5:1 E5:4 D5:2 C5:2 | D5:12 r:4 | "
         "r:4 D5:4 A5:12 B5:2 G5:2 A5:14 A5:2 D6:7 C6:1 | B5:7 A5:1 G5:4 A5:2 G5:2 | "
         "F5:8 E5:6 C5:2 | D5:8 D5:4 F5:2 G5:2 | A5:4 D5:4 E5:4 D5:2 C5:2 | D5:12 r:4")

# Chords per bar: one or two halves, as (root, quality).
QUAL = {"5": (0, 7), "m": (0, 3, 7), "M": (0, 4, 7), "6": (0, 4, 7, 9), "M7": (0, 4, 7, 11),
        "7": (0, 4, 7, 10), "M9": (0, 4, 7, 11, 14), "m7b5": (0, 3, 6, 10), "add9": (0, 2, 4, 7)}
A_CHORDS = {5: [("D", "m"), ("C", "M")], 6: [("A#", "M"), ("D", "m")], 7: [("D", "m"), ("C", "6")],
            8: [("G", "M")], 9: [("A#", "M"), ("C", "M")], 10: [("G", "M")],
            11: [("A#", "M"), ("C", "M")], 12: [("D", "M")]}
CHORDS: dict[int, list[tuple[str, str]]] = {b: [("D", "5")] for b in range(1, 5)}
CHORDS.update(A_CHORDS)
CHORDS.update({21: [("D#", "M7")], 22: [("A#", "M9")], 23: [("B", "m7b5")], 24: [("E", "7")],
               28: [("E", "7")], 29: [("A", "7")], 30: [("A#", "M")], 31: [("C", "add9")],
               32: [("D", "add9")], 33: [("D", "5")]})
C_CHORDS = {42: [("D", "m"), ("C", "M")], 43: [("D", "m")], 44: [("D", "m"), ("C", "M")],
            45: [("G", "M")], 46: [("A#", "M"), ("C", "M")], 47: [("G", "M")],
            48: [("A#", "M"), ("C", "M")], 49: [("D", "M")]}
CHORDS.update(C_CHORDS)
CHORDS.update({b + 8: v for b, v in C_CHORDS.items()})
for _b, _src in REPEAT.items():
    CHORDS[_b] = CHORDS[_src]

RIFF_BARS = [5, 13, 34, 58]
MEL_BARS = [7, 15, 36, 60]


@dataclass
class Note:
    start: int  # in 16ths from song start
    dur: int
    pitch: int
    vel: int


def midi_of(name: str) -> int:
    pc, octave = name[:-1], int(name[-1])
    return 12 * (octave + 1) + NAMES[pc]


def bar_start(bar: int) -> int:
    return (bar - 1) * BAR


def seq(bar: int, text: str, vel: int) -> list[Note]:
    t = bar_start(bar)
    out = []
    for tok in text.replace("|", " ").split():
        name, dur = tok.split(":")
        if name != "r":
            out.append(Note(t, int(dur), midi_of(name), vel))
        t += int(dur)
    return out


def lh(bar: int) -> list[tuple[int, int, int]]:
    """(pos, pitch, dur) of the piano left hand for a bar."""
    src = PIANO_LH[REPEAT.get(bar, bar)]
    return [(int(p), midi_of(n), int(d)) for p, n, d in (x.split(":") for x in src.split())]


def halves(bar: int) -> list[tuple[int, int, tuple[int, ...]]]:
    """(pos, length, pitch classes) of each chord in the bar; first pc is the root."""
    ch = CHORDS[bar]
    span = BAR // len(ch)
    return [(i * span, span, tuple((NAMES[r] + iv) % 12 for iv in QUAL[q])) for i, (r, q) in enumerate(ch)]


def bass_root(pc: int) -> int:
    return 38 + (pc - 2) % 12  # D2..C#3


def bass(bars: range, style: str, vel: int) -> list[Note]:
    """FM bass: root / octave patterns per chord, fifths as passing tones."""
    pats = {
        "pedal": None,
        "bounce": [(0, 2, 0), (2, 2, 0), (4, 2, 12), (6, 2, 0)],
        "bounce5": [(0, 2, 0), (2, 2, 0), (4, 2, 12), (6, 2, 7)],
        "drive": [(0, 3, 0), (3, 1, 0), (4, 2, 12), (6, 1, 0), (7, 1, 12)],
        "b33": [(0, 3, 0), (3, 3, 12), (6, 2, 0)],
        "long": [(0, 6, 0), (6, 2, 12)],
    }
    out = []
    for b in bars:
        if style == "pedal":
            for p, pitch, d in lh(b):
                if pitch < 52:
                    out.append(Note(bar_start(b) + p, d, pitch, vel))
            continue
        for pos, length, pcs in halves(b):
            r = bass_root(pcs[0])
            fifth = r + 7 if r + 7 <= 52 else r - 5
            for sub in range(0, length, 8):
                for p, d, iv in pats[style]:
                    pitch = fifth if iv == 7 else r + iv
                    out.append(Note(bar_start(b) + pos + sub + p, d, pitch, vel if p == 0 else vel - 12))
    return out


def harp_from_lh(bars: range, vel: int, low: int = 53) -> list[Note]:
    """Upper notes of the piano left hand (the off-beat chord tones), one voice."""
    out = []
    for b in bars:
        by_pos: dict[int, tuple[int, int]] = {}
        for p, pitch, d in lh(b):
            if pitch >= low and (p not in by_pos or pitch > by_pos[p][0]):
                by_pos[p] = (pitch, d)
        for p, (pitch, d) in sorted(by_pos.items()):
            out.append(Note(bar_start(b) + p, d, pitch, vel))
    return out


def voice_pads(bars: range, vel: int, lo: int = 53, hi: int = 72) -> tuple[list[Note], list[Note]]:
    """Two-voice pad: pick the two chord tones (avoiding the root when possible) closest to the last voicing."""
    a_out, b_out = [], []
    prev = (57, 62)
    for b in bars:
        for pos, length, pcs in halves(b):
            tones = [p for p in range(lo, hi + 1) if p % 12 in pcs]
            upper = [p for p in tones if p % 12 != pcs[0]] or tones
            best = None
            for x in tones:
                for y in upper:
                    if 3 <= y - x <= 9:
                        cost = abs(x - prev[0]) + abs(y - prev[1]) + (2 if x % 12 == pcs[0] and len(pcs) > 2 else 0)
                        if best is None or cost < best[0]:
                            best = (cost, x, y)
            _, x, y = best
            t = bar_start(b) + pos
            for out, p in ((a_out, x), (b_out, y)):
                if out and out[-1].pitch == p and out[-1].start + out[-1].dur == t:
                    out[-1].dur += length  # tie a held tone
                else:
                    out.append(Note(t, length, p, vel))
            prev = (x, y)
    return a_out, b_out


def arp(bars: range, vel: int, base: int = 69) -> list[Note]:
    """SSG 16th arpeggio over chord tones from `base` upward."""
    out = []
    for b in bars:
        for pos, length, pcs in halves(b):
            tones = sorted(p for p in range(base, base + 13) if p % 12 in pcs)[:4]
            order = tones + tones[-2:0:-1] if len(tones) > 2 else tones * 2
            for i in range(length):
                out.append(Note(bar_start(b) + pos + i, 1, order[i % len(order)], vel - (0 if i % 4 == 0 else 14)))
    return out


def pedal_line(bars: range, vel: int, target: int = 69) -> list[Note]:
    """SSG pedal: the chord tone nearest A4, held."""
    out = []
    for b in bars:
        for pos, length, pcs in halves(b):
            p = min((x for x in range(target - 6, target + 7) if x % 12 in pcs), key=lambda x: (abs(x - target), x))
            t = bar_start(b) + pos
            if out and out[-1].pitch == p and out[-1].start + out[-1].dur == t:
                out[-1].dur += length
            else:
                out.append(Note(t, length, p, vel))
    return out


def echo(notes: list[Note], delay: int, vel_scale: float, lo: int, hi: int) -> list[Note]:
    out = []
    for n in notes:
        if lo <= n.start < hi:
            out.append(Note(n.start + delay, n.dur, n.pitch, max(1, int(n.vel * vel_scale))))
    return out


def transpose(notes: list[Note], semis: int, vel_scale: float = 1.0) -> list[Note]:
    return [Note(n.start, n.dur, n.pitch + semis, int(n.vel * vel_scale)) for n in notes]


def drums() -> list[Note]:
    BD, SD, RIM, HH, OH, CY, TL, TH = 36, 38, 37, 42, 46, 49, 45, 48
    BEND, BEND_FAST = 47, 50  # hand drum with an upward pitch bend, as in the original
    out = []

    def hit(bar: int, pos: int, k: int, v: int) -> None:
        out.append(Note(bar_start(bar) + pos, 1, k, v))

    def hats(bar: int, v: int, step: int = 2) -> None:
        for p in range(0, 16, step):
            hit(bar, p, HH, v if p % 4 == 0 else v - 18)

    for b in range(1, 5):
        hit(b, 0, BD, 92)
        if b % 2:
            hit(b, 6, BEND, 84)
    hit(4, 9, BEND_FAST, 80)
    for b in (3, 4):
        hats(b, 50, 4)
    for b in list(range(5, 21, 2)) + list(range(34, 42, 2)) + list(range(50, 58, 2)) + list(range(58, 66, 2)):
        hit(b, 6, BEND, 80)
    for b in range(5, 13):  # A1: hats, rim backbeat, soft kick
        hats(b, 62)
        hit(b, 0, BD, 80); hit(b, 8, BD, 64)
        hit(b, 4, RIM, 70); hit(b, 12, RIM, 70)
    for b in list(range(13, 21)) + list(range(34, 42)):  # A2/A3
        hats(b, 68)
        hit(b, 0, BD, 92); hit(b, 6, BD, 70); hit(b, 8, BD, 84)
        hit(b, 4, RIM, 74); hit(b, 12, SD, 70)
    for p, k in ((8, TH), (10, TH), (12, TL), (14, TL)):
        hit(20, p, k, 84)
    for b in range(21, 29):  # B: half-time
        hats(b, 66)
        hit(b, 14, OH, 52)
        hit(b, 0, BD, 96); hit(b, 10, BD, 78); hit(b, 8, SD, 84)
    hit(21, 0, CY, 90); hit(25, 0, CY, 74)
    for b in range(29, 33):
        hats(b, 60, 4)
        hit(b, 0, BD, 92); hit(b, 8, SD, 72)
    for p, k, v in ((8, TH, 70), (10, TH, 76), (12, TL, 82), (14, TL, 88)):
        hit(32, p, k, v)
    hit(33, 0, BD, 96); hit(33, 11, BEND, 76)
    hit(34, 0, CY, 76)
    for b in range(42, 50):  # C: nearly bare
        hats(b, 46, 4)
        hit(b, 12, RIM, 56)
    for b in range(50, 58):
        hats(b, 56)
        hit(b, 0, BD, 80); hit(b, 8, BD, 66)
        hit(b, 4, RIM, 64); hit(b, 12, RIM, 66)
    for p, k, v in ((12, TH, 70), (13, TH, 74), (14, TL, 80), (15, TL, 86)):
        hit(57, p, k, v)
    hit(58, 0, CY, 96)
    for b in range(58, 66):  # A4: full
        hats(b, 70)
        hit(b, 0, BD, 98); hit(b, 6, BD, 74); hit(b, 8, BD, 88)
        hit(b, 4, SD, 82); hit(b, 12, SD, 86)
    # last bar thins out so the loop back to the quiet intro is not a cliff
    out = [n for n in out if not (n.start == bar_start(65) + 12 and n.pitch == SD)]
    for n in out:
        if n.start >= bar_start(65) + 8:
            n.vel = int(n.vel * 0.7)
    return out


def build() -> dict[int, list[Note]]:
    ch: dict[int, list[Note]] = {i: [] for i in range(10)}
    a_bars = [(5, 1), (13, 2), (34, 3), (58, 4)]  # (start bar, pass number)

    # FM4 harp: intro figure, riff, off-beat chord tones, C-section arpeggio.
    ch[3] += seq(1, INTRO_HARP + " | " + INTRO_HARP, 84)
    for start, n in a_bars:
        ch[3] += seq(start, RIFF, 96)
        ch[3] += harp_from_lh(range(start + 2, start + 8), 76 if n < 4 else 84)
    ch[3] += harp_from_lh(range(21, 33), 74)
    ch[3] += seq(33, "A3:8", 64)
    ch[3] += harp_from_lh(range(42, 58), 78, low=55)

    # FM1 lead / FM2 double or harmony.
    for start, n in a_bars:
        mel = seq(start + 2, A_MEL, 104)
        ch[0] += mel
        if n in (1, 3):
            ch[1] += seq(start + 2, A_HARM, 82)
        else:
            ch[1] += transpose(mel, 0, 0.8)  # detuned unison double (patch detune)
    ch[0] += seq(21, B_MEL, 106)
    ch[1] += seq(21, B_HARM, 80)
    c_mel = seq(42, C_MEL, 96)
    ch[0] += c_mel

    # FM3 bass.
    ch[2] += bass(range(1, 7), "pedal", 100)
    ch[2] += bass(range(7, 13), "bounce", 100)
    ch[2] += bass(range(13, 15), "pedal", 100)
    ch[2] += bass(range(15, 21), "bounce5", 102)
    ch[2] += bass(range(21, 33), "b33", 104)
    ch[2] += seq(33, "D2:6", 96)
    ch[2] += bass(range(34, 36), "pedal", 100)
    ch[2] += bass(range(36, 42), "bounce5", 102)
    ch[2] += bass(range(42, 50), "long", 88)
    ch[2] += bass(range(50, 58), "bounce", 96)
    ch[2] += bass(range(58, 60), "pedal", 104)
    ch[2] += bass(range(60, 66), "drive", 106)

    # FM5/FM6 pads.
    pa, pb = voice_pads(range(3, 66), 70)
    ch[4] += pa
    ch[5] += pb

    # SSG1 echo: an 8th behind the lead (and the riff), quieter.
    lead_and_riff = sorted(ch[0] + [n for n in ch[3] if any(
        bar_start(s) <= n.start < bar_start(s + 2) for s, _ in a_bars)], key=lambda n: n.start)
    ch[6] += echo(lead_and_riff, 2, 0.62, bar_start(13), bar_start(33))
    ch[6] += echo(lead_and_riff, 2, 0.62, bar_start(34), bar_start(42))
    ch[6] += echo(lead_and_riff, 2, 0.55, bar_start(50), bar_start(66))

    # SSG2 16th arpeggio; SSG3 pedal in C, octave-up double in the last A.
    ch[7] += arp(range(15, 21), 64)
    ch[7] += arp(range(21, 33), 68)
    ch[7] += arp(range(60, 66), 70)
    ch[8] += pedal_line(range(42, 58), 60)
    ch[8] += transpose([n for n in ch[0] if n.start >= bar_start(60)], 12, 0.62)

    ch[9] = drums()
    # Dynamics: the OST's intro, link and C section sit 3-9 dB under the A/B sections.
    for (b0, b1), f, lead_f in (((1, 4), 0.62, 0.62), ((33, 33), 0.75, 0.75), ((42, 49), 0.62, 0.8), ((50, 57), 0.8, 0.9)):
        for k, notes in ch.items():
            for n in notes:
                if bar_start(b0) <= n.start < bar_start(b1 + 1):
                    n.vel = max(1, int(n.vel * (lead_f if k == 0 else f)))
    end = bar_start(N_BARS + 1)
    for k in ch:
        ch[k] = [n for n in ch[k] if n.start < end]
        for n in ch[k]:
            n.dur = min(n.dur, end - n.start)
    return ch


PROGRAMS = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 10, 7: 11, 8: 12, 9: 0}
TRACK_NAMES = {0: "FM1 lead", 1: "FM2 lead2", 2: "FM3 bass", 3: "FM4 harp", 4: "FM5 pad", 5: "FM6 pad",
               6: "SSG1 echo", 7: "SSG2 arp", 8: "SSG3 pedal", 9: "OPNA rhythm"}
# Program changes within a channel: (bar, channel, program).
PROGRAM_CHANGES = [(42, 0, 5), (58, 0, 0)]


def write(ch: dict[int, list[Note]]) -> None:
    mid = mido.MidiFile(type=1, ticks_per_beat=TPB)
    meta = mido.MidiTrack()
    meta.append(mido.MetaMessage("track_name", name="Departure (FFCC) - PC-98 arrange", time=0))
    meta.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    meta.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    meta.append(mido.MetaMessage("key_signature", key="Dm", time=0))
    meta.append(mido.MetaMessage("marker", text="loop end", time=N_BARS * BAR * STEP))
    mid.tracks.append(meta)
    for c in range(10):
        tr = mido.MidiTrack()
        tr.append(mido.MetaMessage("track_name", name=TRACK_NAMES[c], time=0))
        events = [(0, 0, mido.Message("program_change", channel=c, program=PROGRAMS[c]))]
        events += [(bar_start(b) * STEP, 0, mido.Message("program_change", channel=c, program=p))
                   for b, cc, p in PROGRAM_CHANGES if cc == c]
        for n in ch[c]:
            on, off = n.start * STEP, (n.start + n.dur) * STEP - (STEP // 8 if c != 9 else STEP // 2)
            events.append((on, 2, mido.Message("note_on", channel=c, note=n.pitch, velocity=min(127, n.vel))))
            events.append((off, 1, mido.Message("note_off", channel=c, note=n.pitch, velocity=0)))
        events.sort(key=lambda e: (e[0], e[1]))
        now = 0
        for t, _, msg in events:
            tr.append(msg.copy(time=t - now))
            now = t
        mid.tracks.append(tr)
    mid.save(OUT)


if __name__ == "__main__":
    write(build())
    print(f"wrote {OUT}")
