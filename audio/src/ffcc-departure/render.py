"""Render departure-pc98.mid with a small YM2608 (OPNA)-style synth: 4-op FM, SSG squares, rhythm.

Channel 0-5 FM, 6-8 SSG, 9 rhythm; program numbers select patches below.
Each FM/SSG channel is monophonic like the chip: a new key-on cuts the previous note.
The tail past the loop point is folded onto the start so the file loops cleanly.

Run: uv run --with mido --with numpy --with numba --with soundfile python render.py [out.mp3]
"""
import math
import subprocess
import sys
import json
from dataclasses import dataclass, field
from pathlib import Path

import mido
import numba
import numpy as np
import soundfile as sf

SR = 44100
HERE = Path(__file__).parent
MID = HERE / "departure-pc98.mid"
DEFAULT_OUT = HERE.parent.parent / "ffcc-departure-pc98-arrange.mp3"
TAIL_S = 4.0
MODK = 8.0 * math.pi  # phase deviation (rad) of a full-level modulator, as on OPN
FB_TABLE = np.array([0.0, math.pi / 16, math.pi / 8, math.pi / 4, math.pi / 2, math.pi, 2 * math.pi, 4 * math.pi])

# Carrier mask per OPN algorithm (ops 1..4).
CARRIERS = {0: (0, 0, 0, 1), 1: (0, 0, 0, 1), 2: (0, 0, 0, 1), 3: (0, 0, 0, 1),
            4: (0, 1, 0, 1), 5: (0, 1, 1, 1), 6: (0, 1, 1, 1), 7: (1, 1, 1, 1)}


@dataclass
class Op:
    mul: float = 1.0
    dt: float = 0.0  # cents
    tl: float = 0.0  # dB attenuation
    ar: float = 0.005  # seconds to full level
    d1r: float = 0.0  # dB/s
    sl: float = 0.0  # dB
    d2r: float = 0.0  # dB/s
    rr: float = 30.0  # dB/s
    ks: float = 0.0  # rate scaling: rates x 2^(ks*(note-60)/12)


@dataclass
class FMPatch:
    alg: int
    fb: int
    ops: list[Op]
    vol: float = 0.0  # dB
    vib_delay: float = 0.0
    vib_depth: float = 0.0  # cents
    vib_rate: float = 5.5
    detune: float = 0.0  # cents
    vel_db: float = 24.0  # dB range of velocity on carriers


@dataclass
class SSGPatch:
    vol: float = -12.0
    ar: float = 0.0
    decay: float = 0.0  # dB/s
    sustain: float = 0.0  # dB floor of the decay
    rr: float = 40.0
    vib_delay: float = 0.3
    vib_depth: float = 0.0
    vib_rate: float = 5.5
    detune: float = 0.0
    vel_db: float = 20.0


PATCHES: dict[int, FMPatch | SSGPatch] = {
    # 0 lead: two detuned 2-op pairs, soft brass/flute, delayed vibrato
    0: FMPatch(4, 5, [Op(1, 0, 15, 0.01, 30, 5, 2, 30), Op(1, 0, 0, 0.012, 2.5, 4, 1.0, 22),
                      Op(2, 3, 25, 0.01, 20, 6, 2, 30), Op(1, 6, 5, 0.012, 2.5, 4, 1.0, 22)],
               vol=-1, vib_delay=0.32, vib_depth=16, vib_rate=5.3),
    # 1 lead2: thinner reed, detuned against the lead
    1: FMPatch(4, 5, [Op(1, 0, 21, 0.01, 12, 6, 2, 30), Op(1, 0, 0, 0.015, 2.0, 3, 1.0, 22),
                      Op(3, 0, 30, 0.01, 18, 8, 2, 30), Op(1, -4, 7, 0.015, 2.0, 3, 1.0, 22)],
               vol=-5, vib_delay=0.4, vib_depth=12, vib_rate=5.0, detune=-7),
    # 2 finger bass: bright pluck that closes quickly
    2: FMPatch(4, 5, [Op(1, 0, 14, 0.001, 40, 12, 6, 60, 0.2), Op(1, 0, 0, 0.002, 7, 10, 5, 45),
                      Op(1, 3, 20, 0.001, 50, 16, 6, 60), Op(0.5, -3, 6, 0.002, 6, 10, 5, 45)],
               vol=-6, vel_db=16),
    # 3 harp / koto pluck
    3: FMPatch(4, 2, [Op(3, 0, 24, 0.001, 30, 40, 10, 40, 0.3), Op(1, 0, 0, 0.001, 9, 96, 9, 14, 0.25),
                      Op(1, 2, 24, 0.001, 26, 40, 10, 40, 0.3), Op(2, -2, 9, 0.001, 13, 96, 13, 16, 0.25)],
               vol=-1),
    # 4 strings pad: slow attack, detuned pair
    4: FMPatch(4, 3, [Op(1, 0, 25, 0.3, 2, 6, 1, 10), Op(1, 0, 0, 0.32, 1, 3, 0.5, 9),
                      Op(2, 0, 32, 0.3, 2, 6, 1, 10), Op(1, 9, 4, 0.36, 1, 3, 0.5, 9)],
               vol=-4, vib_delay=0.0, vib_depth=5, vib_rate=4.6),
    # 5 soft lead for the quiet section: ocarina-like
    5: FMPatch(4, 1, [Op(1, 0, 33, 0.03, 4, 6, 1, 20), Op(1, 0, 0, 0.045, 2, 3, 1.0, 18),
                      Op(2, 0, 48, 0.03, 4, 6, 1, 20), Op(2, 4, 15, 0.05, 2, 3, 1.0, 18)],
               vol=-4, vib_delay=0.25, vib_depth=18, vib_rate=5.0),
    10: SSGPatch(vol=-5, ar=0.0, decay=5, sustain=-6, rr=30, vib_delay=0.3, vib_depth=12),  # echo
    11: SSGPatch(vol=-11, ar=0.0, decay=45, sustain=-30, rr=80),  # arpeggio
    12: SSGPatch(vol=-12, ar=0.12, decay=1.5, sustain=-4, rr=12, vib_delay=0.5, vib_depth=8),  # pedal
}

# OPNA panning is L, R or both; kept narrow since PC-98 rips are close to mono.
PAN = {0: (1.0, 1.0), 1: (1.0, 0.7), 2: (1.0, 1.0), 3: (0.7, 1.0), 4: (1.0, 0.75), 5: (0.75, 1.0),
       6: (1.0, 1.0), 7: (0.85, 1.0), 8: (1.0, 0.85), 9: (1.0, 1.0)}
DRUM_PAN = {36: (1.0, 1.0), 38: (1.0, 1.0), 37: (1.0, 0.6), 42: (0.6, 1.0), 46: (0.6, 1.0),
            49: (1.0, 1.0), 45: (1.0, 0.7), 48: (0.7, 1.0)}


@dataclass
class NoteEvent:
    ch: int
    start: float
    end: float
    pitch: int
    vel: int
    program: int
    cut: float = field(default=1e9)  # next key-on on the same channel


def read_midi(path: Path) -> tuple[list[NoteEvent], float]:
    mid = mido.MidiFile(path)
    notes: list[NoteEvent] = []
    prog = {c: 0 for c in range(16)}
    on: dict[tuple[int, int], tuple[float, int, int]] = {}
    loop_end = None
    t = 0.0
    for msg in mid:  # merged, time in seconds
        t += msg.time
        if msg.type == "marker" and msg.text == "loop end":
            loop_end = t
        elif msg.type == "program_change":
            prog[msg.channel] = msg.program
        elif msg.type == "note_on" and msg.velocity > 0:
            on[(msg.channel, msg.note)] = (t, msg.velocity, prog[msg.channel])
        elif msg.type in ("note_off", "note_on") and (msg.channel, msg.note) in on:
            s, v, p = on.pop((msg.channel, msg.note))
            notes.append(NoteEvent(msg.channel, s, t, msg.note, v, p))
    notes.sort(key=lambda n: (n.ch, n.start))
    for a, b in zip(notes, notes[1:]):
        if a.ch == b.ch and a.ch != 9:
            a.cut = b.start
    assert loop_end is not None
    return notes, loop_end


@numba.njit
def fm_kernel(n, gate, freq, alg, fbk, mul, dt, tl, ak, d1r, sl, d2r, rr, car, vib_delay, vib_depth, vib_rate, sr):
    out = np.zeros(n)
    phase = np.zeros(4)
    att = np.full(4, 96.0)
    stage = np.zeros(4, np.int64)  # 0 attack, 1 decay1, 2 decay2, 3 release
    o = np.zeros(4)
    p1 = 0.0
    p2 = 0.0
    vib_ph = 0.0
    for i in range(n):
        t = i / sr
        f = freq
        if vib_depth > 0.0 and t > vib_delay:
            ramp = min(1.0, (t - vib_delay) / 0.4)
            f = freq * 2.0 ** (vib_depth * ramp * math.sin(vib_ph) / 1200.0)
            vib_ph += 2.0 * math.pi * vib_rate / sr
        for k in range(4):
            if i == gate:
                stage[k] = 3
            s = stage[k]
            if s == 0:
                att[k] = att[k] * (1.0 - ak[k]) - 0.002
                if att[k] <= 0.0:
                    att[k] = 0.0
                    stage[k] = 1
            elif s == 1:
                att[k] += d1r[k]
                if att[k] >= sl[k]:
                    att[k] = sl[k]
                    stage[k] = 2
            elif s == 2:
                att[k] = min(96.0, att[k] + d2r[k])
            else:
                att[k] = min(96.0, att[k] + rr[k])
        amp = np.empty(4)
        for k in range(4):
            amp[k] = 10.0 ** (-(att[k] + tl[k]) / 20.0)
        o1 = math.sin(phase[0] + fbk * 0.5 * (p1 + p2)) * amp[0]
        p2 = p1
        p1 = o1
        if alg == 0:
            o2 = math.sin(phase[1] + MODK * o1) * amp[1]
            o3 = math.sin(phase[2] + MODK * o2) * amp[2]
            o4 = math.sin(phase[3] + MODK * o3) * amp[3]
        elif alg == 1:
            o2 = math.sin(phase[1]) * amp[1]
            o3 = math.sin(phase[2] + MODK * (o1 + o2)) * amp[2]
            o4 = math.sin(phase[3] + MODK * o3) * amp[3]
        elif alg == 2:
            o2 = math.sin(phase[1]) * amp[1]
            o3 = math.sin(phase[2] + MODK * o2) * amp[2]
            o4 = math.sin(phase[3] + MODK * (o1 + o3)) * amp[3]
        elif alg == 3:
            o2 = math.sin(phase[1] + MODK * o1) * amp[1]
            o3 = math.sin(phase[2]) * amp[2]
            o4 = math.sin(phase[3] + MODK * (o2 + o3)) * amp[3]
        elif alg == 4:
            o2 = math.sin(phase[1] + MODK * o1) * amp[1]
            o3 = math.sin(phase[2]) * amp[2]
            o4 = math.sin(phase[3] + MODK * o3) * amp[3]
        elif alg == 5:
            o2 = math.sin(phase[1] + MODK * o1) * amp[1]
            o3 = math.sin(phase[2] + MODK * o1) * amp[2]
            o4 = math.sin(phase[3] + MODK * o1) * amp[3]
        elif alg == 6:
            o2 = math.sin(phase[1] + MODK * o1) * amp[1]
            o3 = math.sin(phase[2]) * amp[2]
            o4 = math.sin(phase[3]) * amp[3]
        else:
            o2 = math.sin(phase[1]) * amp[1]
            o3 = math.sin(phase[2]) * amp[2]
            o4 = math.sin(phase[3]) * amp[3]
        o[0] = o1
        o[1] = o2
        o[2] = o3
        o[3] = o4
        acc = 0.0
        for k in range(4):
            if car[k]:
                acc += o[k]
        out[i] = acc
        for k in range(4):
            phase[k] += 2.0 * math.pi * f * mul[k] * dt[k] / sr
            if phase[k] > 1e4:
                phase[k] -= 2.0 * math.pi * math.floor(phase[k] / (2.0 * math.pi))
    return out


def midi_hz(p: float) -> float:
    return 440.0 * 2 ** ((p - 69) / 12)


def render_fm(patch: FMPatch, ev: NoteEvent, n: int, gate: int) -> np.ndarray:
    ops = patch.ops
    scale = [2 ** (op.ks * (ev.pitch - 60) / 12) for op in ops]
    car = np.array(CARRIERS[patch.alg], dtype=np.int64)
    vel_att = patch.vel_db * math.log10(127 / max(1, ev.vel)) / math.log10(127 / 16)
    tl = np.array([op.tl + (vel_att if car[k] else 0.0) for k, op in enumerate(ops)])
    # attack coefficient: 96 dB -> ~0.3 dB in `ar` seconds
    ak = np.array([1 - (0.3 / 96) ** (1 / max(1.0, op.ar * SR)) for op in ops])
    per = lambda v, k: v * scale[k] / SR
    return fm_kernel(n, gate, midi_hz(ev.pitch) * 2 ** (patch.detune / 1200), patch.alg, FB_TABLE[patch.fb],
                     np.array([op.mul for op in ops]), np.array([2 ** (op.dt / 1200) for op in ops]), tl, ak,
                     np.array([per(op.d1r, k) for k, op in enumerate(ops)]), np.array([op.sl for op in ops]),
                     np.array([per(op.d2r, k) for k, op in enumerate(ops)]),
                     np.array([per(op.rr, k) for k, op in enumerate(ops)]), car,
                     patch.vib_delay, patch.vib_depth, patch.vib_rate, float(SR)) * 10 ** (patch.vol / 20)


def poly_blep_square(freq: np.ndarray) -> np.ndarray:
    dt = freq / SR
    ph = np.cumsum(dt) % 1.0
    y = np.where(ph < 0.5, 1.0, -1.0)

    def blep(t: np.ndarray, d: np.ndarray) -> np.ndarray:
        r = np.zeros_like(t)
        m = t < d
        x = t[m] / d[m]
        r[m] = x + x - x * x - 1
        m2 = t > 1 - d
        x = (t[m2] - 1) / d[m2]
        r[m2] = x * x + x + x + 1
        return r

    y += blep(ph, dt)
    y -= blep((ph + 0.5) % 1.0, dt)
    return y


def render_ssg(patch: SSGPatch, ev: NoteEvent, n: int, gate: int) -> np.ndarray:
    t = np.arange(n) / SR
    vib = np.zeros(n)
    if patch.vib_depth:
        ramp = np.clip((t - patch.vib_delay) / 0.4, 0, 1)
        vib = patch.vib_depth * ramp * np.sin(2 * np.pi * patch.vib_rate * t)
    freq = midi_hz(ev.pitch) * 2 ** ((patch.detune + vib) / 1200)
    wave = poly_blep_square(freq) * 0.5
    tg = gate / SR
    db = np.maximum(patch.sustain, -patch.decay * t)
    if patch.ar > 0:
        db = db + np.minimum(0, 40 * (t / patch.ar - 1))
    rel_start = db[min(gate, n - 1)]
    db = np.where(t < tg, db, rel_start - patch.rr * (t - tg))
    vel_att = patch.vel_db * math.log10(127 / max(1, ev.vel)) / math.log10(127 / 16)
    db = db - vel_att + patch.vol
    db = np.round(db / 1.5) * 1.5  # SSG volume is stepped
    return wave * 10 ** (db / 20)


def noise(n: int, rng: np.random.Generator) -> np.ndarray:
    return rng.uniform(-1, 1, n)


def one_pole_hp(x: np.ndarray, fc: float) -> np.ndarray:
    a = math.exp(-2 * math.pi * fc / SR)
    y = np.empty_like(x)
    prev_x = prev_y = 0.0
    for i, v in enumerate(x):
        prev_y = a * (prev_y + v - prev_x)
        prev_x = v
        y[i] = prev_y
    return y


def drum_sample(key: int, rng: np.random.Generator) -> np.ndarray:
    """Rough stand-ins for the YM2608 rhythm ROM, made gritty like its 18.5 kHz ADPCM."""
    def env(n: int, tau: float) -> np.ndarray:
        return np.exp(-np.arange(n) / SR / tau)

    if key == 36:  # BD
        n = int(0.35 * SR)
        f = 50 + 110 * np.exp(-np.arange(n) / SR / 0.03)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.12) + 0.3 * noise(n, rng) * env(n, 0.004)
    elif key == 38:  # SD
        n = int(0.25 * SR)
        nz = one_pole_hp(noise(n, rng), 1200)
        x = 0.8 * nz * env(n, 0.07) + 0.6 * np.sin(2 * np.pi * 185 * np.arange(n) / SR) * env(n, 0.05)
    elif key == 37:  # rim shot
        n = int(0.06 * SR)
        t = np.arange(n) / SR
        x = (np.sin(2 * np.pi * 1650 * t) + 0.6 * np.sin(2 * np.pi * 520 * t)) * env(n, 0.012) \
            + 0.4 * noise(n, rng) * env(n, 0.003)
    elif key in (42, 46):  # HH closed / open
        n = int((0.07 if key == 42 else 0.35) * SR)
        x = one_pole_hp(one_pole_hp(noise(n, rng), 6000), 6000) * env(n, 0.025 if key == 42 else 0.12)
    elif key == 49:  # top cymbal
        n = int(1.4 * SR)
        t = np.arange(n) / SR
        metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (587, 845, 1253, 1631)) / 4
        x = (one_pole_hp(noise(n, rng), 4000) * 0.8 + 0.25 * one_pole_hp(metal, 3000)) * env(n, 0.45)
    elif key in (47, 50):  # hand drum bending up (slow D#2->C3, fast D2->D3)
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        f0, f1, tau = (78, 131, 0.18) if key == 47 else (73, 147, 0.06)
        f = f1 - (f1 - f0) * np.exp(-t / tau)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.22) + 0.2 * noise(n, rng) * env(n, 0.006)
    elif key in (45, 48):  # toms
        n = int(0.4 * SR)
        f0 = 150 if key == 48 else 105
        f = f0 * (1 + 0.6 * np.exp(-np.arange(n) / SR / 0.05))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.16) + 0.15 * noise(n, rng) * env(n, 0.01)
    else:
        return np.zeros(1)
    # sample-and-hold to 18.5 kHz and 8-bit steps
    hold = SR / 18500
    idx = (np.floor(np.arange(len(x)) / hold) * hold).astype(int)
    x = x[idx]
    return np.round(x * 127) / 127


DRUM_DB = {36: -3, 38: -8, 37: -13, 42: -14, 46: -16, 49: -15, 45: -8, 48: -8, 47: -6, 50: -7}


def render(notes: list[NoteEvent], loop_end: float) -> tuple[np.ndarray, dict[int, np.ndarray]]:
    total = int((loop_end + TAIL_S) * SR)
    stems = {c: np.zeros((total, 2)) for c in range(10)}
    rng = np.random.default_rng(98)
    drum_cache = {k: drum_sample(k, rng) for k in DRUM_DB}
    fade = int(0.003 * SR)
    for ev in notes:
        s = int(round(ev.start * SR))
        if ev.ch == 9:
            x = drum_cache.get(ev.pitch)
            if x is None:
                continue
            x = x * (ev.vel / 127) ** 1.5 * 10 ** (DRUM_DB[ev.pitch] / 20)
            pan = DRUM_PAN.get(ev.pitch, (1.0, 1.0))
        else:
            patch = PATCHES[ev.program]
            gate = int(round((ev.end - ev.start) * SR))
            rel = 2.5 if isinstance(patch, SSGPatch) else 3.0
            n = gate + int(rel * SR)
            cut = int(round((ev.cut - ev.start) * SR))
            n = min(n, cut + fade, total - s)
            if n <= 0:
                continue
            gate = min(gate, n)
            x = render_fm(patch, ev, n, gate) if isinstance(patch, FMPatch) else render_ssg(patch, ev, n, gate)
            if cut < len(x):
                x[cut:] *= np.linspace(1, 0, len(x) - cut)
            pan = PAN[ev.ch]
        e = min(total, s + len(x))
        stems[ev.ch][s:e, 0] += x[: e - s] * pan[0]
        stems[ev.ch][s:e, 1] += x[: e - s] * pan[1]
    loop_n = int(round(loop_end * SR))
    folded = {}
    for c, st in stems.items():
        y = st[:loop_n].copy()
        tail = st[loop_n:]
        y[: len(tail)] += tail  # wrap the release tails onto the loop start
        folded[c] = y
    mix = sum(folded.values())
    # gentle output filter (OPNA board's analog stage)
    mix = lowpass(mix, 15000)
    mix -= mix.mean(axis=0)
    return mix, folded


def lowpass(x: np.ndarray, fc: float) -> np.ndarray:
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= (1 / np.sqrt(1 + (f / fc) ** 8))[:, None]
    return np.fft.irfft(spec, n=len(x), axis=0)


def encode(wav: Path, out: Path) -> None:
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav), "-af",
                            "loudnorm=I=-17:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    af = (f"loudnorm=I=-17:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-af", af,
                    "-ar", str(SR), "-ac", "2", "-c:a", "libmp3lame", "-b:a", "128k", str(out)], check=True)


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT
    stem_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    notes, loop_end = read_midi(MID)
    mix, stems = render(notes, loop_end)
    peak = np.abs(mix).max()
    mix = mix / peak * 0.7
    wav = out.with_suffix(".wav")
    sf.write(wav, mix.astype(np.float32), SR, subtype="FLOAT")
    if stem_dir:
        stem_dir.mkdir(parents=True, exist_ok=True)
        for c, st in stems.items():
            sf.write(stem_dir / f"ch{c}.wav", (st / peak * 0.7).astype(np.float32), SR, subtype="FLOAT")
    if out.suffix == ".mp3":
        encode(wav, out)
        wav.unlink()
    print(f"wrote {out} ({loop_end:.2f} s loop)")


if __name__ == "__main__":
    main()
