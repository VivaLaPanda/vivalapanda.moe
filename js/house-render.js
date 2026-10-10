// Panda's house, drawn live: a room's index map painted at the real time of day, with its real lamps' light on it.
// Time of day is a register change, the PC-98 way: the same pixels with a phase's 16 colours (scene.json "phases").
// The view through the glass is its own layer per phase. A lamp that's on adds its light: its traced field (a
// greyscale PNG) times its colour (from Kelvin, or a hex colour) and brightness, on each pixel's day ink. The light
// steps in the period's tile bands (Bayer 4x4 cut at 0, 2, 4, 8, 12, 14, 16 of 16), between neighbours on one ramp,
// and every colour lands on the 4096-colour grid. Runs in the browser and in Node (HouseRender.renderPixels).
(function (root) {
    "use strict";

    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    var CUTS = [0, 2, 4, 8, 12, 14, 16];
    var STEPS = 5;                       // light levels per unit of field: the bands a glow falls off in

    var S2L = new Float32Array(256);
    for (var i = 0; i < 256; i++) {
        var c = i / 255;
        S2L[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    function lin2s(v) {
        v = v <= 0 ? 0 : v >= 1 ? 1 : v;
        return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    }

    function hexRGB(h) {
        h = h.replace("#", "");
        if (h.length === 3) return [0, 1, 2].map(function (k) { return parseInt(h[k], 16) * 17; });
        return [0, 2, 4].map(function (k) { return parseInt(h.substr(k, 2), 16); });
    }

    function hexLin(h) {
        return hexRGB(h).map(function (v) { return S2L[v]; });
    }

    // a light's colour from its Kelvin (Tanner Helland's fit of the blackbody locus), linear, brightest channel 1
    function kelvinLin(k) {
        var t = Math.max(1000, Math.min(40000, k)) / 100, r, g, b;
        r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
        g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
        b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
        var rgb = [r, g, b].map(function (v) { return S2L[Math.max(0, Math.min(255, Math.round(v)))]; });
        var top = Math.max(rgb[0], rgb[1], rgb[2]) || 1;
        return rgb.map(function (v) { return v / top; });
    }

    function lightColour(l) {
        if (l.color) {
            var c = hexLin(l.color), top = Math.max(c[0], c[1], c[2]) || 1;
            return c.map(function (v) { return v / top; });
        }
        return kelvinLin(l.kelvin || 2700);
    }

    function snap(v) {
        return Math.round(v / 17) * 17;
    }

    // snap(lin2s(v)) without the pow: the linear values where each of the 16 output levels starts, found by bisecting
    // the same function, so the result is identical
    var LEVEL_AT = [];
    for (var lv = 1; lv < 16; lv++) {
        var lo = 0, hi = 1;
        while (true) {
            var mid = (lo + hi) / 2;
            if (mid === lo || mid === hi) break;
            if (snap(lin2s(mid)) >= lv * 17) hi = mid; else lo = mid;
        }
        LEVEL_AT.push(hi);
    }

    function snapLin(v) {
        var k = 0;
        while (k < 15 && v >= LEVEL_AT[k]) k++;
        return k * 17;
    }

    // the nearest period tile level for a fraction
    function cut(f) {
        var best = 0, d = 99;
        for (var k = 0; k < CUTS.length; k++) {
            var e = Math.abs(f * 16 - CUTS[k]);
            if (e < d) { d = e; best = CUTS[k]; }
        }
        return best;
    }

    // a lamp's halo: the pixels within 3px of its shade (worked out once per scene)
    function haloOf(spec, w, h) {
        if (spec._halo || !spec.shade) return spec._halo || null;
        var m = spec.shade, out = new Uint8Array(w * h);
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
            var p = y * w + x;
            if (!m[p]) continue;
            for (var dy = -3; dy <= 3; dy++) for (var dx = -3; dx <= 3; dx++) {
                var yy = y + dy, xx = x + dx;
                if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
                var q = yy * w + xx, d = Math.abs(dx) + Math.abs(dy);
                if (!m[q] && d <= 4 && (!out[q] || out[q] > d)) out[q] = d;
            }
        }
        spec._halo = out;
        return out;
    }

    /**
     * The room at a phase with its lights, as RGBA pixels (native size).
     * scene: { w, h, idx: Uint8Array, phases: {phase: [16 hex]}, albedo: [16 hex],
     *          outside: { mask: Uint8Array, layers: {phase: Uint8ClampedArray rgba} } | null,
     *          lights: { name: { field: Uint8Array, gain: number, shade: Uint8Array | null } } }
     * state: { phase, lights: { name: { on, brightness_pct, kelvin, color } }, override: Uint8Array | null }
     *   override: per-pixel index replacements (255 = none): the blinds' cloth, the thermostat's heating face.
     */
    function renderPixels(scene, state, rect) {
        var w = scene.w, h = scene.h;
        rect = rect || { x: 0, y: 0, w: w, h: h };
        var amb = scene.ambient ? (scene.ambient[state.phase] || 1) : 1;      // a little under full by day: the
        var pal = (scene.phases[state.phase] || scene.phases.noon).map(function (h) {   // glass's light gives direction
            return hexLin(h).map(function (v) { return v * amb; });
        });
        var alb = scene.albedo.map(hexLin);
        var out = new Uint8ClampedArray(rect.w * rect.h * 4);
        var on = [], offShades = [];
        Object.keys(scene.lights || {}).forEach(function (name) {
            var l = (state.lights || {})[name];
            if (!l || !l.on) {
                if (scene.lights[name].shade) offShades.push(scene.lights[name].shade);
                return;
            }
            var spec = scene.lights[name];
            var bri = l.brightness_pct == null ? 1 : Math.max(0.05, l.brightness_pct / 100);
            var fixed = spec.phaseColor ? spec.phaseColor[state.phase] : spec.color;
            on.push({ field: spec.field, shade: spec.shade, halo: haloOf(spec, w, h),
                      col: fixed ? lightColour({ color: fixed }) : lightColour(l),
                      gain: (spec.gain || 1) * bri * (spec.phaseGain ? spec.phaseGain[state.phase] || 0 : 1),
                      glow: bri });
        });
        var phaseDark = { night: 1, dusk: 0.8, dawn: 0.8, sunset: 0.5, evening: 0.4 }[state.phase] || 0;
        var layer = scene.outside && scene.outside.layers[state.phase];
        var omask = scene.outside && scene.outside.mask;
        var ov = state.override;
        for (var ry = 0; ry < rect.h; ry++) for (var rx = 0; rx < rect.w; rx++) {
            var p = (rect.y + ry) * w + rect.x + rx;
            var o = (ry * rect.w + rx) * 4;
            var ix = ov && ov[p] !== 255 ? ov[p] : scene.idx[p];
            if (layer && omask[p] && !(ov && ov[p] !== 255)) {
                out[o] = layer[p * 4]; out[o + 1] = layer[p * 4 + 1]; out[o + 2] = layer[p * 4 + 2]; out[o + 3] = 255;
                continue;
            }
            var base = pal[ix], a = alb[ix];
            var r = 0, g = 0, b = 0, shade = 0, sc = null;
            for (var k = 0; k < on.length; k++) {
                var L = on[k];
                if (L.shade && L.shade[p] && L.glow > shade) { shade = L.glow; sc = L.col; }
                var f = L.field ? L.field[p] : 0;          // (a light still loading adds nothing)
                if (!f) continue;
                var e = L.gain * f / 255;
                r += L.col[0] * e; g += L.col[1] * e; b += L.col[2] * e;
            }
            var R = base[0], G = base[1], B = base[2];
            for (var k3 = 0; k3 < offShades.length; k3++) {
                if (offShades[k3][p]) { R *= 0.62; G *= 0.62; B *= 0.66; break; }     // a lamp that's off: its shade unlit
            }
            var m = Math.max(r, g, b);
            if (m > 0) {
                // the light's strength in bands: floor, then the next level in a period tile
                var q = m * STEPS, fl = Math.floor(q), lv = cut(q - fl);
                var x = rect.x + rx, y = rect.y + ry;
                var s = (fl + (BAYER[(y & 3) * 4 + (x & 3)] < lv ? 1 : 0)) / STEPS / m;
                R += a[0] * r * s; G += a[1] * g * s; B += a[2] * b * s;
            }
            // a lit lamp's halo: its colour over the 3px round its shade, in the period's tile steps (2px solid-ish,
            // then a checker, then sparse dots), stronger after dark
            for (var k4 = 0; k4 < on.length; k4++) {
                var Lh = on[k4], hd = Lh.halo ? Lh.halo[p] : 0;
                if (!hd || (Lh.shade && Lh.shade[p])) continue;
                var cutH = hd <= 1 ? 12 : hd <= 2 ? 8 : 4;
                var bx = p % w, by = (p / w) | 0;
                if (BAYER[(by & 3) * 4 + (bx & 3)] < cutH) {
                    var hk = (0.45 + 0.55 * Lh.glow) * (0.6 + 0.4 * (phaseDark || 0));
                    R = Math.max(R, hk * Lh.col[0]); G = Math.max(G, hk * Lh.col[1]); B = Math.max(B, hk * Lh.col[2]);
                }
                break;
            }
            if (shade) {
                // a lit shade glows in the lamp's own colour, as bright as the lamp is set
                var k2 = 0.7 + 0.3 * shade;
                R = k2 * (0.35 + 0.65 * sc[0]);
                G = k2 * (0.35 + 0.65 * sc[1]);
                B = k2 * (0.35 + 0.65 * sc[2]);
            }
            out[o] = snapLin(R); out[o + 1] = snapLin(G); out[o + 2] = snapLin(B); out[o + 3] = 255;
        }
        return out;
    }

    // ---------- loading (browser) ----------

    function image(src) {
        return new Promise(function (ok, fail) {
            var im = new Image();
            im.onload = function () { ok(im); };
            im.onerror = function () { fail(new Error("couldn't load " + src)); };
            im.src = src;
        });
    }

    function pixels(im) {
        var c = document.createElement("canvas");
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        var x = c.getContext("2d");
        x.drawImage(im, 0, 0);
        return x.getImageData(0, 0, c.width, c.height).data;
    }

    // a greyscale map's channel (an index map stores index * 16 + 8)
    function grey(data, f) {
        var n = data.length / 4, out = new Uint8Array(n);
        for (var p = 0; p < n; p++) out[p] = f(data[p * 4]);
        return out;
    }

    function bit(v) { return v > 127 ? 1 : 0; }
    function same(v) { return v; }

    // The scene, as soon as scene.json is in, with what every frame reads already on its way: the index map, the glass's
    // mask, the lamps' shades, the masks the room's overrides use. need() waits for those and asks for the rest of a
    // frame's files (a lamp's light, the view at a time of day) in the same go, so the first frame waits on one round of
    // its own files. The hotspots' masks aren't loaded: nothing reads them.
    function load(base, v) {
        var q = v ? "?v=" + v : "";
        function get(file, decode) {
            return image(base + file + q).then(function (im) { return decode(pixels(im)); });
        }
        return fetch(base + "scene.json" + q).then(function (r) {
            if (!r.ok) throw new Error("scene.json HTTP " + r.status);
            return r.json();
        }).then(function (spec) {
            spec.w = spec.size[0]; spec.h = spec.size[1];
            spec.later = { get: get, layers: {}, fields: {}, pending: {} };
            var jobs = [get(spec.idx, function (d) { return grey(d, function (v) { return v >> 4; }); })
                .then(function (a) {
                    // a browser that won't read back a canvas (anti-fingerprinting) hands back one flat colour: then
                    // there's nothing to draw from, and the room keeps its static picture
                    var seen = {}, kinds = 0;
                    for (var p = 0; p < a.length && kinds < 4; p += 97) if (!seen[a[p]]) { seen[a[p]] = 1; kinds++; }
                    if (kinds < 4) throw new Error("canvas readback looks blocked");
                    spec.idx = a;
                })];
            if (spec.outside) {
                jobs.push(get(spec.outside.mask, function (d) { return grey(d, bit); })
                    .then(function (a) { spec.outside.mask = a; }));
                spec.later.layers = spec.outside.layers;
                spec.outside.layers = {};
            }
            spec.mask = {};
            var hotspot = {};
            Object.keys(spec.hotspots || {}).forEach(function (id) { hotspot[spec.hotspots[id].mask] = true; });
            (spec.masks || []).forEach(function (f) {
                if (hotspot[f]) return;
                jobs.push(get(f, function (d) { return grey(d, bit); }).then(function (a) { spec.mask[f] = a; }));
            });
            Object.keys(spec.lights || {}).forEach(function (name) {
                var l = spec.lights[name];
                spec.later.fields[name] = l.field;
                l.field = null;
                if (l.shade) {
                    jobs.push(get(l.shade, function (d) { return grey(d, bit); }).then(function (a) { l.shade = a; }));
                } else {
                    l.shade = null;
                }
            });
            spec.later.base = Promise.all(jobs).then(function () { spec.later.based = true; });
            spec.later.base.catch(function () {});               // (need() hands a failure on)
            return spec;
        });
    }

    // the files a frame at `phase` with `lights` on still lacks: null when it has them all, else a promise that settles
    // once they're in (it rejects if the scene's own files failed; a light or a view that fails is left out: the frame
    // draws without it)
    function need(spec, phase, lights) {
        var L = spec.later;
        if (!L) return null;
        var jobs = L.based ? [] : [L.base], done = L.done = L.done || {};
        function want(key, file, decode, put) {
            if (!file) return;
            if (!L.pending[key]) {
                L.pending[key] = L.get(file, decode).then(put, function (err) {
                    console.warn("house: " + err.message);
                }).then(function () { done[key] = true; });
            }
            if (!done[key]) jobs.push(L.pending[key]);
        }
        if (spec.outside && !spec.outside.layers[phase]) {
            want("view:" + phase, L.layers[phase], same, function (a) { spec.outside.layers[phase] = a; });
        }
        Object.keys(lights || {}).forEach(function (name) {
            var l = spec.lights[name];
            if (!l || l.field || !lights[name] || !lights[name].on) return;
            if (l.phaseGain && !l.phaseGain[phase]) return;              // (daylight at night: no light to add)
            want("light:" + name, L.fields[name], function (d) { return grey(d, same); },
                 function (a) { l.field = a; });
        });
        return jobs.length ? Promise.all(jobs) : null;
    }

    // a render at 4x, nearest neighbour, as a data URL for an <img>
    function toURL(rgba, w, h, scale) {
        scale = scale || 4;
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").putImageData(new ImageData(rgba, w, h), 0, 0);
        var big = document.createElement("canvas");
        big.width = w * scale; big.height = h * scale;
        var x = big.getContext("2d");
        x.imageSmoothingEnabled = false;
        x.drawImage(c, 0, 0, big.width, big.height);
        return big.toDataURL("image/png");
    }

    var api = { load: load, need: need, renderPixels: renderPixels, toURL: toURL, kelvinLin: kelvinLin };
    if (typeof module !== "undefined" && module.exports) module.exports = api;
    else root.HouseRender = api;
})(typeof self !== "undefined" ? self : this);
