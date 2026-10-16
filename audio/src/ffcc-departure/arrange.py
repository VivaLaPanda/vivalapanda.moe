"""PC-98 (YM2608/OPNA) arrange of "Departure" (Final Fantasy Crystal Chronicles, Kumi Tanioka).

Writes departure-pc98.mid: one MIDI channel per OPNA voice.
  ch0 FM1 recorder lead (reed chanter in C)   ch1 FM2 second recorder   ch2 FM3 bass
  ch3 FM4 harp        ch4 FM5 pad             ch5 FM6 pad (A drone in the C section)
  ch6 SSG1 echo       ch7/ch8 SSG2/SSG3 unused
  ch9 OPNA rhythm (36 frame drum, 47/50 hand drum with upward bend, 54 tambourine)
Program numbers pick render.py patches.

Notes come from the piano reduction by Cerulean Pictures (VGMusic "dparture.mid"),
checked against the OST recording; bars 1-65 of the original form one loop.
Run: uv run --with mido python arrange.py
"""
from dataclasses import dataclass
from pathlib import Path

import mido

BPM = 120  # the OST measures 120.1 BPM on a 16th grid
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

# Melodies, sequential "note:dur16" tokens; r = rest. Checked against the OST's top line.
RIFF = "A4:4 F4:2 D5:2 C5:2 C4:2 G4:2 A#4:2 | A4:4 A4:2 A#4:2 A4:4 F4:2 D4:2"
INTRO_HARP = "A4:4 D4:2 D4:4 A3:2 D4:2 A3:2 | D4:8 A3:2 A3:2 A3:4"
# The hook (bars 5-6) is a sustained recorder line over the harp arpeggio; the piano reduction merges the two.
HOOK = "A4:6 D5:2 C5:8 | A4:6 A#4:2 A4:4 r:4"
# G5 at the end of bar 7 is held into bar 8 in the OST, not re-struck.
A_MEL = ("F5:6 A5:2 E5:6 G5:10 D5:6 r:2 | F5:6 D5:2 E5:6 C5:2 | D5:12 r:4 | "
         "F5:6 G5:2 E5:6 C5:2 | D5:12 r:4")
A_HARM = ("D5:6 F5:2 A4:6 C5:2 | B4:8 B4:6 r:2 | A#4:6 A#4:2 A4:6 A4:2 | G4:12 r:4 | "
          "A#4:6 D5:2 A4:6 A4:2 | A4:12 r:4")
B_MEL = ("D5:6 C5:2 F5:6 D5:2 | A4:6 A#4:2 C5:6 D5:2 | E5:6 F5:2 G5:6 A5:2 | E5:6 F5:2 D5:8 | "
         "D5:6 C5:2 F5:6 D5:2 | A4:6 A#4:2 C5:6 D5:2 | E5:6 F5:2 G5:6 A5:2 | E5:6 F5:2 G5:6 D5:2 | "
         "E5:16 | D5:16 | E5:16 | D5:16")
# Inner voice of the piano under the B melody: a pedal that follows the melody rhythm.
B_HARM = ("G4:6 G4:2 G4:6 G4:2 | F4:6 F4:2 F4:6 F4:2 | A4:6 A4:2 A4:6 A4:2 | G#4:6 G#4:2 G#4:8 | "
          "G4:6 G4:2 G4:6 G4:2 | F4:6 F4:2 F4:6 F4:2 | A4:6 A4:2 A4:6 A4:2 | G#4:6 G#4:2 G#4:6 G#4:2 | "
          "G4:16 | A#4:16 | C5:16 | A4:16")
# The OST plays this an octave below the piano reduction, on a reedy chanter over an A drone.
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
    """FM bass: the piano left hand (pedal) or root / octave patterns per chord."""
    pats = {
        "pedal": None,
        "piano": [(0, 2, 0), (2, 2, 12)],
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
    """Frame drum (kick + bending hand drum) and tambourine on 2 and 4, as in the OST."""
    BD, BEND, BEND_FAST, TAMB = 36, 47, 50, 54
    out = []

    def hit(bar: int, pos: int, k: int, v: int) -> None:
        out.append(Note(bar_start(bar) + pos, 1, k, v))

    for b in range(1, 66):
        if b == 33:
            hit(b, 0, BD, 96); hit(b, 11, BEND, 76)
            continue
        hit(b, 0, BD, 96)
        hit(b, 6, BEND if b % 2 else BD, 82 if b % 2 else 70)
        if b >= 5:
            hit(b, 4, TAMB, 78); hit(b, 12, TAMB, 84)
    hit(4, 9, BEND_FAST, 80)
    return out


def build() -> dict[int, list[Note]]:
    ch: dict[int, list[Note]] = {i: [] for i in range(10)}
    a_starts = [5, 13, 34, 58]

    # FM4 harp: intro figure, the riff arpeggio, off-beat chord tones, C-section arpeggio.
    ch[3] += seq(1, INTRO_HARP + " | " + INTRO_HARP, 84)
    for start in a_starts:
        ch[3] += seq(start, RIFF, 88)
        ch[3] += harp_from_lh(range(start + 2, start + 8), 80)
    ch[3] += harp_from_lh(range(21, 33), 80)
    ch[3] += seq(33, "A3:8", 64)
    ch[3] += harp_from_lh(range(42, 58), 80, low=55)

    # FM1 recorder lead (reed chanter in C, an octave down); FM2 second recorder in thirds / inner voice.
    for start in a_starts:
        ch[0] += seq(start, HOOK, 104)
        ch[0] += seq(start + 2, A_MEL, 108)
        ch[1] += seq(start + 2, A_HARM, 84)
    ch[0] += seq(21, B_MEL, 108)
    ch[1] += seq(21, B_HARM, 74)
    ch[0] += transpose(seq(42, C_MEL, 104), -12)

    # FM3 bass: the piano left hand's roots, with the octave jump on the second 8th.
    ch[2] += bass(range(1, 7), "pedal", 100)
    ch[2] += bass(range(7, 13), "piano", 100)
    ch[2] += bass(range(13, 15), "pedal", 100)
    ch[2] += bass(range(15, 33), "piano", 100)
    ch[2] += seq(33, "D2:6", 96)
    ch[2] += bass(range(34, 36), "pedal", 100)
    ch[2] += bass(range(36, 42), "piano", 100)
    ch[2] += bass(range(42, 58), "long", 92)
    ch[2] += bass(range(58, 60), "pedal", 100)
    ch[2] += bass(range(60, 66), "piano", 102)

    # FM5/FM6 soft string pad under everything.
    pa, pb = voice_pads(range(3, 66), 64)
    ch[4] += pa
    in_c = lambda n: bar_start(42) <= n.start < bar_start(58)
    ch[5] += [n for n in pb if not in_c(n)]
    # In C, FM6 turns into the soft A drone the OST holds over the chanter.
    ch[5] += pedal_line(range(42, 58), 92)

    # SSG1: quiet echo of the lead an 8th behind, only in the 2nd and 4th A melody.
    for start in (13, 58):
        ch[6] += echo(ch[0], 2, 0.5, bar_start(start + 2), bar_start(start + 8))

    ch[9] = drums()
    # Dynamics: the OST's intro, link and C section sit 3-9 dB under the A/B sections.
    for (b0, b1), f, lead_f in (((1, 4), 0.72, 0.72), ((33, 33), 0.85, 0.85), ((42, 49), 0.55, 0.68), ((50, 57), 0.68, 0.82)):
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
TRACK_NAMES = {0: "FM1 recorder", 1: "FM2 recorder 2", 2: "FM3 bass", 3: "FM4 harp", 4: "FM5 pad", 5: "FM6 pad / drone",
               6: "SSG1 echo", 7: "SSG2", 8: "SSG3", 9: "OPNA rhythm"}
# Program changes within a channel: (bar, channel, program).
PROGRAM_CHANGES = [(42, 0, 5), (58, 0, 0), (42, 5, 1), (58, 5, 4)]


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
