/*
 * pc98.js: redraw an image as late-80s/90s NEC PC-98 art, the way a pixel artist would trace it:
 * shapes first (flat cel regions with clean borders and dark 1px line art), then fills from at most 16 inks
 * picked from the 4096-colour (4 bits per channel) grid, with the period's tile-pattern dithers (1/8 dots,
 * 1/4 dot grid, 1/2 checkerboard and inverses) only where a tone changes across a shape.
 * Style rules and the reasoning behind them: PC98_STYLE_GUIDE.md (kept with the filter's test bench).
 *
 * Dependency-free and deterministic (same input + options -> same pixels, in the browser and in Node).
 * Load it as a classic script (window.PC98), import it for its side effect (globalThis.PC98), or require() it.
 *
 *   PC98.render(imgOrCanvas, opts) -> HTMLCanvasElement   (browser; the source must be CORS-readable)
 *   PC98.process(rgba, w, h, opts) -> { width, height, palette, index, rgba, pixel, preset }   (no DOM)
 *   PC98.upscale(result, k)        -> { width, height, data }   integer nearest-neighbour upscale
 *
 * Options (all optional):
 *   width, height  target size in CSS px (one of them keeps the aspect ratio; default: the source size)
 *   pixel          CSS px per art pixel (1). The art is width/pixel wide; render() returns it scaled up by
 *                  `pixel` with nearest-neighbour. Style the canvas with `image-rendering: pixelated`.
 *   preset         'auto' (default: picks by looking at the source), 'photo' or 'illustration'
 *   colors         palette size, 2..16 (16). Black is always one ink; white joins when the image has highlights.
 *   dither         tile-pattern strength, 0 (flat cels only) .. 1 (default for photos) .. 2 (lots)
 *   outline        line-art amount, 0 (none) .. 1 (0.5 for photos, 0 for illustrations)
 *   saturation, tone, contrast   colour grade: chroma gain, PC-98 scene tint (navy/lavender shadows, peach
 *                  light), S-curve. Lower `tone` for a more literal palette.
 *   shading        0..1: how much of the source's own shading survives inside each shape (0 photo, 0.6 illus.)
 *   background     [r,g,b] to composite transparent sources onto; by default 1-bit transparency is kept
 */
(function (root) {
  'use strict';

  // ================================================================ colour math (sRGB <-> linear <-> OKLab)
  var S2L = new Float32Array(256);
  for (var i0 = 0; i0 < 256; i0++) {
    var c0 = i0 / 255;
    S2L[i0] = c0 <= 0.04045 ? c0 / 12.92 : Math.pow((c0 + 0.055) / 1.055, 2.4);
  }
  function lin2s(v) {
    v = v <= 0 ? 0 : v >= 1 ? 1 : v;
    return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  }
  function lin2lab(r, g, b, out, o) {
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    out[o] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    out[o + 1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    out[o + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  }
  function lab2lin(L, A, B, out, o) {
    var l = L + 0.3963377774 * A + 0.2158037573 * B;
    var m = L - 0.1055613458 * A - 0.0638541728 * B;
    var s = L - 0.0894841775 * A - 1.291485548 * B;
    l = l * l * l; m = m * m * m; s = s * s * s;
    out[o] = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    out[o + 1] = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    out[o + 2] = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  }
  var T3 = new Float64Array(3), T3b = new Float64Array(3);
  function rgb2lab(r, g, b, out, o) { lin2lab(S2L[r], S2L[g], S2L[b], out, o); }

  function mulberry32(a) { // deterministic PRNG for k-means++ seeding
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function percentile(arr, n, q) { // arr: Float32Array of OKLab triples; percentile of L
    var hist = new Uint32Array(1024);
    for (var i = 0; i < n; i++) {
      var v = arr[i * 3]; v = v < 0 ? 0 : v > 1 ? 1 : v;
      hist[(v * 1023) | 0]++;
    }
    var target = q * n, acc = 0;
    for (var k = 0; k < 1024; k++) { acc += hist[k]; if (acc >= target) return k / 1023; }
    return 1;
  }

  // ================================================================ presets and options
  var PRESETS = {
    // photographs: segment into simple shapes, flat or banded fills, line art on strong borders, scene tint
    photo: {
      colors: 16, pixel: 1, dither: 1, outline: 0.5, saturation: 1.7, tone: 1.2, contrast: 0.32, key: 0.64,
      keyAmount: 0.7, shading: 0, ink: 0.45, inkChroma: 1.25, segK: 0.35, segSigmaR: 0.14, minRegion: 24,
      ditherMinArea: 60, roundShapes: 2, seamMerge: 0.035, fitRidge: 0.02,
    },
    // drawings, logos, charts: keep the artist's shapes, colours and shading; dither less; add no lines
    illustration: {
      colors: 16, pixel: 1, dither: 0.5, outline: 0, saturation: 1.1, tone: 0.3, contrast: 0.05, key: 0.55,
      keyAmount: 0.3, shading: 0.6, ink: 0.35, inkChroma: 1.08, segK: 0.35, segSigmaR: 0.1, minRegion: 12,
      ditherMinArea: 60, roundShapes: 2, seamMerge: 0.035, fitRidge: 0.02,
    },
  };

  // 'auto': drawings, logos and charts have big exactly-flat areas and few distinct colours; photos have neither
  function detectPreset(rgba, w, h) {
    var flat = 0, tot = 0, seen = new Uint8Array(32768), cols = 0, sx = Math.max(1, (w / 160) | 0), sy = Math.max(1, (h / 160) | 0);
    for (var y = 0; y < h - 1; y += sy) {
      for (var x = 0; x < w - 1; x += sx) {
        var p = (y * w + x) * 4, q = p + 4, r = p + w * 4;
        tot++;
        if (Math.abs(rgba[p] - rgba[q]) <= 2 && Math.abs(rgba[p + 1] - rgba[q + 1]) <= 2 && Math.abs(rgba[p + 2] - rgba[q + 2]) <= 2 &&
          Math.abs(rgba[p] - rgba[r]) <= 2 && Math.abs(rgba[p + 1] - rgba[r + 1]) <= 2 && Math.abs(rgba[p + 2] - rgba[r + 2]) <= 2) flat++;
        var key = (rgba[p] >> 3) << 10 | (rgba[p + 1] >> 3) << 5 | (rgba[p + 2] >> 3);
        if (!seen[key]) { seen[key] = 1; cols++; }
      }
    }
    flat /= Math.max(1, tot);
    return (cols < 300 && flat > 0.3) || flat > 0.65 ? 'illustration' : 'photo';
  }

  function resolveOptions(opts) {
    var name = PRESETS[opts.preset] ? opts.preset : 'photo', o = {}, k;
    for (k in PRESETS[name]) o[k] = PRESETS[name][k];
    for (k in opts) if (opts[k] !== undefined && k !== 'preset') o[k] = opts[k];
    o.preset = name;
    o.colors = Math.max(2, Math.min(16, o.colors | 0));
    o.pixel = Math.max(1, o.pixel | 0);
    o.ditherRel = 0.05 / Math.max(o.dither, 0.01);
    o.ditherAbs = 0.00012 / Math.max(o.dither, 0.01);
    o.bg = o.background || [0, 0, 0];
    o.seed = o.seed || 98;
    return o;
  }

  // ================================================================ 1. resample: area average in linear light
  // returns OKLab; if `cover` is given, transparent sources are un-premultiplied (no dark fringe) and the
  // per-pixel coverage is written to it, otherwise everything is composited over `bg`
  function resample(src, sw, sh, dw, dh, bg, cover) {
    var out = new Float32Array(dw * dh * 3), sx = sw / dw, sy = sh / dh;
    for (var y = 0; y < dh; y++) {
      var y0 = y * sy, y1 = y0 + sy;
      for (var x = 0; x < dw; x++) {
        var x0 = x * sx, x1 = x0 + sx, r = 0, g = 0, b = 0, ws = 0, wa = 0;
        for (var yy = Math.floor(y0); yy < y1 && yy < sh; yy++) {
          var wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
          for (var xx = Math.floor(x0); xx < x1 && xx < sw; xx++) {
            var wt = wy * (Math.min(xx + 1, x1) - Math.max(xx, x0)), o = (yy * sw + xx) * 4, al = src[o + 3] / 255;
            r += wt * al * S2L[src[o]]; g += wt * al * S2L[src[o + 1]]; b += wt * al * S2L[src[o + 2]];
            ws += wt; wa += wt * al;
          }
        }
        var p = (y * dw + x) * 3, a = wa / ws;
        if (cover) {
          cover[y * dw + x] = a;
          if (wa > 1e-6) lin2lab(r / wa, g / wa, b / wa, out, p);
          else lin2lab(bg[0], bg[1], bg[2], out, p);
        } else {
          lin2lab(r / ws + bg[0] * (1 - a), g / ws + bg[1] * (1 - a), b / ws + bg[2] * (1 - a), out, p);
        }
      }
    }
    return out; // OKLab
  }

  // ================================================================ 2. grade: levels, key, saturation, scene tint
  // PC-98 colour is "drawn" colour: true black, true white, lavender/navy shadows, warm peach light, clean accents.
  function grade(lab, n, o) {
    var lo = percentile(lab, n, 0.004), hi = percentile(lab, n, 0.996), med = percentile(lab, n, 0.5);
    var span = Math.max(hi - lo, 1 / 1.8), newLo = Math.min(lo, 0.06) * 0.5, gain = (0.995 - newLo) / span;
    med = Math.min(0.95, Math.max(0.05, newLo + (med - lo) * gain));
    var gamma = Math.log(o.key) / Math.log(med);
    gamma = 1 + (Math.min(1.15, Math.max(0.72, gamma)) - 1) * o.keyAmount;
    function hv(deg, c) { var r = deg * Math.PI / 180; return [Math.cos(r) * c, Math.sin(r) * c]; }
    var SH = hv(282, 0.06), MD = hv(305, 0.025), HL = hv(68, 0.03);
    var con = o.contrast, sat = o.saturation, tone = o.tone;
    for (var i = 0; i < n; i++) {
      var p = i * 3, L = lab[p], A = lab[p + 1], B = lab[p + 2];
      L = newLo + (L - lo) * gain;
      L = L < 0 ? 0 : L > 1 ? 1 : L;
      L = Math.pow(L, gamma);
      L += con * (L * L * (3 - 2 * L) - L);
      if (L > 0.8) L = 0.8 + (L - 0.8) * (0.55 + 0.45 * (L - 0.8) / 0.2); // soft knee: lit skin and clouds keep a tone
      var C = Math.sqrt(A * A + B * B);
      A *= sat; B *= sat;
      var neutral = Math.max(0, 1 - C / 0.16); neutral *= neutral;
      if (neutral > 0 && C > 0.025 && L > 0.35 && B > 0) { // skin and warm light keep their warmth (hue 20-95 deg)
        var hue = Math.atan2(B, A) * 57.2958;
        if (hue > 20 && hue < 95) neutral *= 0.25;
      }
      var wS = Math.max(0, 1 - L / 0.5), wH = Math.max(0, (L - 0.75) / 0.25), wM = Math.max(0, 1 - Math.abs(L - 0.6) / 0.25);
      wS = Math.sqrt(wS) * (L > 0.04 ? 1 : L / 0.04);
      A += tone * neutral * (SH[0] * wS + MD[0] * wM + HL[0] * wH);
      B += tone * neutral * (SH[1] * wS + MD[1] * wM + HL[1] * wH);
      lab[p] = L; lab[p + 1] = A; lab[p + 2] = B;
    }
  }

  // ================================================================ 3. flatten (for finding shapes): domain-transform recursive filter
  // (Gastal & Oliveira 2011) large-radius edge-aware smoothing in O(n): texture becomes cel regions, edges stay.
  function domainTransform(lab, w, h, sigmaS, sigmaR, iters) {
    var n = w * h, dH = new Float32Array(n), dV = new Float32Array(n), k = sigmaS / sigmaR, x, y, p, q, s;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        p = y * w + x;
        if (x > 0) { q = p - 1; s = Math.abs(lab[p * 3] - lab[q * 3]) * 1.5 + Math.abs(lab[p * 3 + 1] - lab[q * 3 + 1]) + Math.abs(lab[p * 3 + 2] - lab[q * 3 + 2]); dH[p] = 1 + k * s; }
        if (y > 0) { q = p - w; s = Math.abs(lab[p * 3] - lab[q * 3]) * 1.5 + Math.abs(lab[p * 3 + 1] - lab[q * 3 + 1]) + Math.abs(lab[p * 3 + 2] - lab[q * 3 + 2]); dV[p] = 1 + k * s; }
      }
    }
    var V = new Float32Array(n), c;
    for (var it = 0; it < iters; it++) {
      var sH = sigmaS * Math.sqrt(3) * Math.pow(2, iters - (it + 1)) / Math.sqrt(Math.pow(4, iters) - 1);
      var lna = -Math.SQRT2 / sH;
      for (p = 0; p < n; p++) V[p] = Math.exp(lna * dH[p]);
      for (y = 0; y < h; y++) {
        var row = y * w;
        for (x = 1; x < w; x++) { p = row + x; for (c = 0; c < 3; c++) lab[p * 3 + c] += V[p] * (lab[(p - 1) * 3 + c] - lab[p * 3 + c]); }
        for (x = w - 2; x >= 0; x--) { p = row + x; for (c = 0; c < 3; c++) lab[p * 3 + c] += V[p + 1] * (lab[(p + 1) * 3 + c] - lab[p * 3 + c]); }
      }
      for (p = 0; p < n; p++) V[p] = Math.exp(lna * dV[p]);
      for (x = 0; x < w; x++) {
        for (y = 1; y < h; y++) { p = y * w + x; for (c = 0; c < 3; c++) lab[p * 3 + c] += V[p] * (lab[(p - w) * 3 + c] - lab[p * 3 + c]); }
        for (y = h - 2; y >= 0; y--) { p = y * w + x; for (c = 0; c < 3; c++) lab[p * 3 + c] += V[p + w] * (lab[(p + w) * 3 + c] - lab[p * 3 + c]); }
      }
    }
  }

  // ================================================================ 4. palette: weighted k-means in OKLab -> 4096 grid
  function inGamut(L, A, B) {
    lab2lin(L, A, B, T3, 0);
    return T3[0] >= -0.002 && T3[0] <= 1.002 && T3[1] >= -0.002 && T3[1] <= 1.002 && T3[2] >= -0.002 && T3[2] <= 1.002;
  }
  function snap12(L, A, B) { // best of the 8 surrounding 4-bit-per-channel grid points, by OKLab distance
    L = L < 0 ? 0 : L > 1 ? 1 : L;
    if (!inGamut(L, A, B)) { // pull chroma in (keeping hue and lightness) until the colour is displayable
      var lo = 0, hi = 1;
      for (var it = 0; it < 14; it++) { var mid = (lo + hi) / 2; if (inGamut(L, A * mid, B * mid)) lo = mid; else hi = mid; }
      A *= lo; B *= lo;
    }
    lab2lin(L, A, B, T3, 0);
    var r = lin2s(T3[0]) / 17, g = lin2s(T3[1]) / 17, b = lin2s(T3[2]) / 17, best = null, bd = 1e9;
    for (var i = 0; i < 8; i++) {
      var R = Math.min(15, Math.max(0, i & 1 ? Math.ceil(r) : Math.floor(r)));
      var G = Math.min(15, Math.max(0, i & 2 ? Math.ceil(g) : Math.floor(g)));
      var Bc = Math.min(15, Math.max(0, i & 4 ? Math.ceil(b) : Math.floor(b)));
      rgb2lab(R * 17, G * 17, Bc * 17, T3b, 0);
      var d = (T3b[0] - L) * (T3b[0] - L) * 2 + (T3b[1] - A) * (T3b[1] - A) + (T3b[2] - B) * (T3b[2] - B);
      if (d < bd) { bd = d; best = [R * 17, G * 17, Bc * 17]; }
    }
    return best;
  }

  function buildPalette(lab, n, o, rnd, solid) {
    // sample with a deterministic stride; weight colourful, skin-like and lit pixels up so accents and faces
    // get their own entries instead of five shades of murky shadow
    var step = Math.max(1, Math.floor(n / 6000)), m = Math.ceil(n / step);
    var S = new Float32Array(m * 3), W = new Float32Array(m), i, j, k;
    for (i = 0, j = 0; i < n && j < m; i += step, j++) {
      var L = lab[i * 3], A = lab[i * 3 + 1], B = lab[i * 3 + 2];
      S[j * 3] = L; S[j * 3 + 1] = A; S[j * 3 + 2] = B;
      var C = Math.sqrt(A * A + B * B), hue = Math.atan2(B, A) * 57.2958;
      var skin = hue > 25 && hue < 85 && C > 0.03 && C < 0.17 && L > 0.45 && L < 0.92 ? 1 : 0;
      W[j] = solid && !solid[i] ? 0 : (1 + 6 * Math.min(C, 0.25) / 0.25 + 1.5 * skin) * (0.35 + L);
    }
    m = j;
    var cent = [[0, 0, 0]], nFixed = 1; // black: the outline colour, always present
    if (percentile(lab, n, 0.997) > 0.86) { cent.push([1, 0, 0]); nFixed++; } // white for highlights
    var K = o.colors, d2 = new Float64Array(m), lab3 = S;
    function nearest(q) {
      var bd = 1e9, best = 0;
      for (var c = 0; c < cent.length; c++) {
        var e = cent[c], dl = lab3[q] - e[0], da = lab3[q + 1] - e[1], db = lab3[q + 2] - e[2], dd = dl * dl + da * da + db * db;
        if (dd < bd) { bd = dd; best = c; }
      }
      T3[0] = bd; return best;
    }
    for (j = 0; j < m; j++) { nearest(j * 3); d2[j] = T3[0] * W[j]; }
    while (cent.length < K) { // k-means++ seeding (distances updated incrementally)
      var tot = 0;
      if (cent.length > nFixed || cent.length > 1) {
        var e0 = cent[cent.length - 1];
        for (j = 0; j < m; j++) {
          var q0 = j * 3, dl0 = S[q0] - e0[0], da0 = S[q0 + 1] - e0[1], db0 = S[q0 + 2] - e0[2];
          var dd0 = (dl0 * dl0 + da0 * da0 + db0 * db0) * W[j];
          if (dd0 < d2[j]) d2[j] = dd0;
        }
      }
      for (j = 0; j < m; j++) tot += d2[j];
      if (tot <= 1e-9) break;
      var r = rnd() * tot, acc = 0, pick = m - 1;
      for (j = 0; j < m; j++) { acc += d2[j]; if (acc >= r) { pick = j; break; } }
      cent.push([S[pick * 3], S[pick * 3 + 1], S[pick * 3 + 2]]);
    }
    var sums = new Float64Array(cent.length * 4);
    for (var it = 0; it < 10; it++) {
      sums.fill(0);
      for (j = 0; j < m; j++) {
        k = nearest(j * 3);
        sums[k * 4] += S[j * 3] * W[j]; sums[k * 4 + 1] += S[j * 3 + 1] * W[j]; sums[k * 4 + 2] += S[j * 3 + 2] * W[j]; sums[k * 4 + 3] += W[j];
      }
      for (k = nFixed; k < cent.length; k++) {
        if (sums[k * 4 + 3] > 0) { cent[k][0] = sums[k * 4] / sums[k * 4 + 3]; cent[k][1] = sums[k * 4 + 1] / sums[k * 4 + 3]; cent[k][2] = sums[k * 4 + 2] / sums[k * 4 + 3]; }
      }
    }
    // averaging greys colours out; give the inks back a little chroma, then snap to the 4096 grid
    var pal = [], seen = {};
    for (k = 0; k < cent.length; k++) {
      var e = cent[k], boost = k < nFixed ? 1 : o.inkChroma;
      var rgb = snap12(e[0], e[1] * boost, e[2] * boost), key = rgb.join(',');
      if (!seen[key]) { seen[key] = 1; pal.push(rgb); }
    }
    return pal;
  }

  // ================================================================ 5. tile patterns
  // The 4x4 Bayer matrix cut at n/16: 2 = sparse dots, 4 = dot grid, 8 = checkerboard, 12/14 the inverses.
  // These are the PC-98 tile patterns; they nest, so a gradient reads as clean bands.
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var LEVELS = [2, 4, 8, 12, 14];
  var NL = LEVELS.length;

  function pairTable(pal, o) {
    var P = pal.length, plab = new Float64Array(P * 3), plin = new Float64Array(P * 3), i, j, l;
    for (i = 0; i < P; i++) {
      rgb2lab(pal[i][0], pal[i][1], pal[i][2], plab, i * 3);
      plin[i * 3] = S2L[pal[i][0]]; plin[i * 3 + 1] = S2L[pal[i][1]]; plin[i * 3 + 2] = S2L[pal[i][2]];
    }
    // mix[(i*P+j)*NL + l] for i darker than j: OKLab of the pattern's average (mixed in linear light) and its cost
    var mix = new Float64Array(P * P * NL * 3), pen = new Float64Array(P * P * NL).fill(1e9);
    for (i = 0; i < P; i++) {
      for (j = 0; j < P; j++) {
        if (i === j || plab[i * 3] > plab[j * 3] || (plab[i * 3] === plab[j * 3] && i > j)) continue;
        var dL = plab[i * 3] - plab[j * 3], dA = plab[i * 3 + 1] - plab[j * 3 + 1], dB = plab[i * 3 + 2] - plab[j * 3 + 2];
        var dist2 = dL * dL + dA * dA + dB * dB;
        for (l = 0; l < NL; l++) {
          var t = LEVELS[l] / 16, x = (i * P + j) * NL + l;
          lin2lab(plin[i * 3] * (1 - t) + plin[j * 3] * t, plin[i * 3 + 1] * (1 - t) + plin[j * 3 + 1] * t, plin[i * 3 + 2] * (1 - t) + plin[j * 3 + 2] * t, mix, x * 3);
          // a pattern must earn its place: it costs a share of the pair's own contrast (so close pairs, the
          // ramp neighbours artists dither between, are cheap) plus a floor; contrasty pairs read as noise
          var sparse = LEVELS[l] === 2 || LEVELS[l] === 14 ? 1.4 : 1, D = Math.sqrt(dist2), over = Math.max(0, D - 0.22);
          pen[x] = (o.ditherRel * dist2 + o.ditherAbs) * sparse + 0.5 * over * over;
        }
      }
    }
    return { P: P, plab: plab, mix: mix, pen: pen };
  }

  // ================================================================ 5b. choose flat or pattern per pixel
  // label = a | b << 5 | level << 10   (flat: a === b, level 0)
  function choose(lab, n, flatMask, T, o) {
    var P = T.P, plab = T.plab, mix = T.mix, pen = T.pen;
    var label = new Int32Array(n), dist = new Float64Array(P), near = [0, 0, 0, 0, 0];
    var LW = 1.5, NK = Math.min(5, P), useDither = o.dither > 0;
    var cache = new Map(), qk = 0;
    for (var i = 0; i < n; i++) {
      var L = lab[i * 3], A = lab[i * 3 + 1], B = lab[i * 3 + 2], c, k;
      // fills are smooth, so most pixels repeat a colour already decided (quantized to ~0.002 in OKLab)
      qk = ((((L * 512) | 0) * 1024 + (((A + 1) * 512) | 0)) * 1024 + (((B + 1) * 512) | 0)) * 2 + (flatMask[i] ? 1 : 0);
      var hit = cache.get(qk);
      if (hit !== undefined) { label[i] = hit; continue; }
      for (c = 0; c < P; c++) {
        var dl = plab[c * 3] - L, da = plab[c * 3 + 1] - A, db = plab[c * 3 + 2] - B;
        dist[c] = dl * dl * LW + da * da + db * db;
      }
      // the NK nearest inks (insertion into a tiny sorted list)
      var cnt = 0;
      for (c = 0; c < P; c++) {
        var pos = cnt < NK ? cnt : NK;
        while (pos > 0 && dist[near[pos - 1]] > dist[c]) { if (pos < NK) near[pos] = near[pos - 1]; pos--; }
        if (pos < NK) near[pos] = c;
        if (cnt < NK) cnt++;
      }
      var best = near[0] | near[0] << 5, bd = dist[near[0]];
      if (useDither && !flatMask[i]) {
        for (var u = 0; u < cnt; u++) {
          for (var v = u + 1; v < cnt; v++) {
            var a = near[u], b = near[v];
            if (plab[a * 3] > plab[b * 3] || (plab[a * 3] === plab[b * 3] && a > b)) { var tt = a; a = b; b = tt; }
            var base = (a * P + b) * NL;
            for (k = 0; k < NL; k++) {
              var x = base + k, ml = mix[x * 3] - L, ma = mix[x * 3 + 1] - A, mb = mix[x * 3 + 2] - B;
              var d = ml * ml * LW + ma * ma + mb * mb + pen[x];
              if (d < bd) { bd = d; best = a | b << 5 | (k + 1) << 10; }
            }
          }
        }
      }
      label[i] = best;
      cache.set(qk, best);
    }
    return label;
  }

  // ================================================================ 3b. shapes: graph segmentation (Felzenszwalb-Huttenlocher)
  // A pixel artist works in shapes, then fills. Segment the flattened image into regions whose borders follow
  // real edges; small high-contrast bits (letters, lamps, eyes) survive, small low-contrast crumbs merge away.
  function segment(lab, w, h, k, minSize, crumbMax) {
    var n = w * h, E = 0, x, y, p, i;
    var ea = new Int32Array(n * 4), eb = new Int32Array(n * 4), ew = new Float32Array(n * 4);
    function add(a, b) {
      var dl = (lab[a * 3] - lab[b * 3]) * 1.3, da = lab[a * 3 + 1] - lab[b * 3 + 1], db = lab[a * 3 + 2] - lab[b * 3 + 2];
      ea[E] = a; eb[E] = b; ew[E] = Math.sqrt(dl * dl + da * da + db * db); E++;
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      p = y * w + x;
      if (x + 1 < w) add(p, p + 1);
      if (y + 1 < h) add(p, p + w);
      if (x + 1 < w && y + 1 < h) add(p, p + w + 1);
      if (x > 0 && y + 1 < h) add(p, p + w - 1);
    }
    // counting sort by quantized weight (deterministic, O(E))
    var NB = 4096, cnt = new Int32Array(NB + 1), q = new Int32Array(E), order = new Int32Array(E);
    for (i = 0; i < E; i++) { var b = Math.min(NB - 1, (ew[i] * 2048) | 0); q[i] = b; cnt[b + 1]++; }
    for (i = 0; i < NB; i++) cnt[i + 1] += cnt[i];
    for (i = 0; i < E; i++) order[cnt[q[i]]++] = i;
    var parent = new Int32Array(n), size = new Int32Array(n).fill(1), thr = new Float32Array(n).fill(k);
    for (i = 0; i < n; i++) parent[i] = i;
    function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
    var j, e, ra, rb;
    for (j = 0; j < E; j++) {
      e = order[j]; ra = find(ea[e]); rb = find(eb[e]);
      if (ra === rb) continue;
      if (ew[e] <= thr[ra] && ew[e] <= thr[rb]) {
        if (size[ra] < size[rb]) { var t = ra; ra = rb; rb = t; }
        parent[rb] = ra; size[ra] += size[rb]; thr[ra] = ew[e] + k / size[ra];
      }
    }
    for (j = 0; j < E; j++) { // crumbs: merge small regions into their most similar neighbour unless they stand out
      e = order[j]; ra = find(ea[e]); rb = find(eb[e]);
      if (ra === rb) continue;
      if ((size[ra] < minSize || size[rb] < minSize) && (ew[e] < crumbMax || size[ra] < 3 || size[rb] < 3)) {
        if (size[ra] < size[rb]) { var t2 = ra; ra = rb; rb = t2; }
        parent[rb] = ra; size[ra] += size[rb];
      }
    }
    var seg = new Int32Array(n);
    for (i = 0; i < n; i++) seg[i] = find(i);
    return seg;
  }

  // smooth ragged borders: a pixel moves to another region only when 7 of its 8 neighbours are that region
  // (so one-pixel poles, wires and lines stay)
  function tidyRegions(seg, w, h, passes) {
    var out = new Int32Array(seg);
    for (var ps = 0; ps < passes; ps++) {
      for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
        var p = y * w + x, me = seg[p], cand = -1, c = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          var r = seg[p + dy * w + dx];
          if (r === me) continue;
          if (cand < 0 || r === cand) { cand = r; c++; }
        }
        if (c >= 7) out[p] = cand;
      }
      seg.set(out);
    }
  }


  // round off wiggles on big shapes: a pixel of a large region joins the 5x5 majority when that majority is
  // another large region (thin features belong to small regions and are left alone)
  function roundRegions(seg, w, h, minBig, passes) {
    var n = w * h, size = new Int32Array(n), out = new Int32Array(seg), keys = new Int32Array(25), cnts = new Int32Array(25);
    for (var ps = 0; ps < passes; ps++) {
      size.fill(0);
      for (var i = 0; i < n; i++) size[seg[i]]++;
      for (var y = 2; y < h - 2; y++) for (var x = 2; x < w - 2; x++) {
        var p = y * w + x, me = seg[p];
        if (size[me] < minBig) continue;
        if (seg[p - 1] === me && seg[p + 1] === me && seg[p - w] === me && seg[p + w] === me &&
          seg[p - w - 1] === me && seg[p - w + 1] === me && seg[p + w - 1] === me && seg[p + w + 1] === me) continue;
        var nk = 0, best = me, bc = 0;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
          var l = seg[p + dy * w + dx], t = 0;
          while (t < nk && keys[t] !== l) t++;
          if (t === nk) { keys[nk] = l; cnts[nk] = 0; nk++; }
          if (++cnts[t] > bc) { bc = cnts[t]; best = l; }
        }
        if (best !== me && bc >= 15 && size[best] >= minBig) out[p] = best;
      }
      seg.set(out);
    }
  }

  // ================================================================ 3c. fills: a smooth tone field per shape
  // so its dither reads as one regular field, banded straight across the shape like a painted gradient
  function solve(M, b, m, nrhs) { // in-place Gaussian elimination with partial pivoting; M is m x m, b is m x nrhs
    for (var c = 0; c < m; c++) {
      var piv = c, best = Math.abs(M[c * m + c]);
      for (var r = c + 1; r < m; r++) if (Math.abs(M[r * m + c]) > best) { best = Math.abs(M[r * m + c]); piv = r; }
      if (best < 1e-14) return false;
      if (piv !== c) {
        for (var k = 0; k < m; k++) { var t = M[c * m + k]; M[c * m + k] = M[piv * m + k]; M[piv * m + k] = t; }
        for (k = 0; k < nrhs; k++) { t = b[c * nrhs + k]; b[c * nrhs + k] = b[piv * nrhs + k]; b[piv * nrhs + k] = t; }
      }
      for (r = 0; r < m; r++) {
        if (r === c) continue;
        var f = M[r * m + c] / M[c * m + c];
        if (!f) continue;
        for (k = c; k < m; k++) M[r * m + k] -= f * M[c * m + k];
        for (k = 0; k < nrhs; k++) b[r * nrhs + k] -= f * b[c * nrhs + k];
      }
    }
    for (c = 0; c < m; c++) for (k = 0; k < nrhs; k++) b[c * nrhs + k] /= M[c * m + c];
    return true;
  }

  // Each shape gets a smooth tone field: flat for small shapes, planar for medium ones, quadratic for big ones
  // (a sky's glow, a lit wall). Its dither then reads as one regular field banded across the shape.
  var NA = 39; // per region: 21 Gram entries of [1 X Y XX XY YY] + 3 channels x 6 moments
  function relabel(seg, n) {
    var id = new Int32Array(n).fill(-1), rid = new Int32Array(n), R = 0;
    for (var i = 0; i < n; i++) { var s0 = seg[i]; if (id[s0] < 0) id[s0] = R++; rid[i] = id[s0]; }
    return { rid: rid, R: R };
  }
  function accumulate(lab, rid, R, w, h) {
    var A = new Float64Array(R * NA), S = Math.max(w, h), phi = new Float64Array(6);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x, r = rid[i] * NA, X = (x - w / 2) / S, Y = (y - h / 2) / S, t = 0, a, b2, c;
      phi[0] = 1; phi[1] = X; phi[2] = Y; phi[3] = X * X; phi[4] = X * Y; phi[5] = Y * Y;
      for (a = 0; a < 6; a++) for (b2 = a; b2 < 6; b2++) A[r + t++] += phi[a] * phi[b2];
      for (c = 0; c < 3; c++) { var v = lab[i * 3 + c]; for (a = 0; a < 6; a++) A[r + 21 + c * 6 + a] += phi[a] * v; }
    }
    return A;
  }
  var GIDX = (function () { var g = new Int32Array(36), t = 0; for (var p = 0; p < 6; p++) for (var q = p; q < 6; q++) { g[p * 6 + q] = g[q * 6 + p] = t++; } return g; })();
  function solveFits(A, R, o, scale) {
    var coef = new Float64Array(R * 18), M = new Float64Array(36), B = new Float64Array(18), bigN = 300 * scale * scale;
    for (var r = 0; r < R; r++) {
      var base = r * NA, N = A[base], m = N < 12 ? 1 : N < bigN ? 3 : 6, p, q, c;
      for (p = 0; p < m; p++) {
        for (q = 0; q < m; q++) M[p * m + q] = A[base + GIDX[p * 6 + q]] / N;
        // ridge on the shape terms: small shapes lean flat, nothing extrapolates wildly
        if (p > 0) M[p * m + p] += (p < 3 ? o.fitRidge : o.fitRidge * 0.05) / N + 1e-7;
        for (c = 0; c < 3; c++) B[p * 3 + c] = A[base + 21 + c * 6 + p] / N;
      }
      if (!solve(M, B, m, 3)) { m = 1; for (c = 0; c < 3; c++) B[c] = A[base + 21 + c * 6] / N; }
      for (p = 0; p < 6; p++) for (c = 0; c < 3; c++) coef[r * 18 + c * 6 + p] = p < m ? B[p * 3 + c] : 0;
    }
    return coef;
  }
  function evaluateFits(coef, rid, lab, w, h, keep) {
    var tgt = new Float32Array(w * h * 3), S = Math.max(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = y * w + x, r = rid[i] * 18, X = (x - w / 2) / S, Y = (y - h / 2) / S;
      for (var k = 0; k < 3; k++) {
        var f = coef[r + k * 6] + coef[r + k * 6 + 1] * X + coef[r + k * 6 + 2] * Y +
          coef[r + k * 6 + 3] * X * X + coef[r + k * 6 + 4] * X * Y + coef[r + k * 6 + 5] * Y * Y;
        tgt[i * 3 + k] = f + keep * (lab[i * 3 + k] - f);
      }
    }
    return tgt;
  }
  function fitRegions(lab, seg, w, h, o, scale) {
    var n = w * h, L = relabel(seg, n), A = accumulate(lab, L.rid, L.R, w, h);
    var coef = solveFits(A, L.R, o, scale), tgt = evaluateFits(coef, L.rid, lab, w, h, o.shading);
    if (o.seamMerge > 0) {
      var group = mergeSeams(L.rid, L.R, tgt, w, h, o.seamMerge);
      if (group) { // stats are additive: merged shapes are refit without another pass over the pixels
        var G = relabel(group, L.R), A2 = new Float64Array(G.R * NA);
        for (var r = 0; r < L.R; r++) { var d = G.rid[r] * NA, s1 = r * NA; for (var k = 0; k < NA; k++) A2[d + k] += A[s1 + k]; }
        var rid2 = new Int32Array(n);
        for (var i = 0; i < n; i++) rid2[i] = G.rid[L.rid[i]];
        coef = solveFits(A2, G.R, o, scale);
        return { rid: rid2, R: G.R, tgt: evaluateFits(coef, rid2, lab, w, h, o.shading) };
      }
    }
    return { rid: L.rid, R: L.R, tgt: tgt };
  }

  // merge neighbouring shapes whose fills meet without a visible step (a sky cut into blobs by the
  // segmentation is one sky). Returns a group id per region, or null when nothing merges.
  function mergeSeams(rid, R, tgt, w, h, thr) {
    var size = 1; while (size < R * 8) size <<= 1;
    var keys = new Int32Array(size).fill(-1), sums = new Float32Array(size), cnts = new Int32Array(size), mask = size - 1, x, y, p, i;
    function acc(a, b) {
      var ra = rid[a], rb = rid[b];
      if (ra === rb) return;
      var key = ra < rb ? ra * R + rb : rb * R + ra, slot = (Math.imul(key, 0x9e3779b1) >>> 0) & mask;
      while (keys[slot] !== -1 && keys[slot] !== key) slot = (slot + 1) & mask;
      var dl = (tgt[a * 3] - tgt[b * 3]) * 1.3, da = tgt[a * 3 + 1] - tgt[b * 3 + 1], db = tgt[a * 3 + 2] - tgt[b * 3 + 2];
      keys[slot] = key; sums[slot] += Math.sqrt(dl * dl + da * da + db * db); cnts[slot]++;
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      p = y * w + x;
      if (x + 1 < w) acc(p, p + 1);
      if (y + 1 < h) acc(p, p + w);
    }
    var parent = new Int32Array(R), merged = false;
    for (i = 0; i < R; i++) parent[i] = i;
    function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
    for (i = 0; i < size; i++) {
      if (keys[i] < 0 || cnts[i] < 3 || sums[i] / cnts[i] >= thr) continue;
      var a = find((keys[i] / R) | 0), b = find(keys[i] % R);
      if (a !== b) { if (a < b) parent[b] = a; else parent[a] = b; merged = true; }
    }
    if (!merged) return null;
    var group = new Int32Array(R);
    for (i = 0; i < R; i++) group[i] = find(i);
    return group;
  }

  // ================================================================ 6. line art along shape borders
  // A dark 1px line on the darker side of every strong border, in a deep ink of that side's hue.
  function regionLines(rid, tgt, w, h, index, pal, plab, o) {
    var n = w * h, drawn = new Uint8Array(n);
    if (o.outline <= 0) return drawn;
    var P = pal.length, thr = 0.06 + 0.1 * (1 - Math.min(1, o.outline)), x, y;
    function skinlike(p) {
      var L = tgt[p * 3], A = tgt[p * 3 + 1], B = tgt[p * 3 + 2], C = Math.sqrt(A * A + B * B), hh = Math.atan2(B, A) * 57.2958;
      return L > 0.42 && C > 0.02 && hh > 15 && hh < 100;
    }
    function mark(a, b) {
      var dl = (tgt[a * 3] - tgt[b * 3]) * 1.3, da = tgt[a * 3 + 1] - tgt[b * 3 + 1], db = tgt[a * 3 + 2] - tgt[b * 3 + 2];
      var c = Math.sqrt(dl * dl + da * da + db * db);
      // cel-shading steps inside skin are not contours: no ink between two skin tones unless the jump is big
      if (c < thr || (c < thr * 2.5 && skinlike(a) && skinlike(b))) return;
      var s = tgt[a * 3] <= tgt[b * 3] ? a : b;
      drawn[s] = 1;
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var p = y * w + x;
      if (x + 1 < w && rid[p] !== rid[p + 1]) mark(p, p + 1);
      if (y + 1 < h && rid[p] !== rid[p + w]) mark(p, p + w);
    }
    // pixel-perfect: a line pixel sitting in the elbow of an L (one neighbour across, one down, nothing else)
    // doubles the stroke on diagonals; drop it so diagonals step cleanly one pixel at a time
    for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) {
      var q = y * w + x;
      if (!drawn[q]) continue;
      var N = drawn[q - w], S = drawn[q + w], W = drawn[q - 1], E = drawn[q + 1];
      if (N + S + W + E !== 2 || (N && S) || (W && E)) continue;
      var dgl = N ? (W ? drawn[q - w - 1] : drawn[q - w + 1]) : (W ? drawn[q + w - 1] : drawn[q + w + 1]);
      if (!dgl) drawn[q] = 0;
    }
    // ink per pixel: darker than what it outlines, same hue family
    for (var i = 0; i < n; i++) {
      if (!drawn[i]) continue;
      var dark = tgt[i * 3], tL = dark * o.ink, tA = tgt[i * 3 + 1] * 0.9, tB = tgt[i * 3 + 2] * 0.9, best = 0, bd = 1e9;
      for (var c = 0; c < P; c++) {
        if (plab[c * 3] > dark - 0.08 && plab[c * 3] > 0.02) continue;
        var e1 = plab[c * 3] - tL, e2 = plab[c * 3 + 1] - tA, e3 = plab[c * 3 + 2] - tB, d = e1 * e1 * 2 + e2 * e2 + e3 * e3;
        if (d < bd) { bd = d; best = c; }
      }
      index[i] = best;
    }
    return drawn;
  }

  // ================================================================ the pipeline
  function nativeSize(sw, sh, o) {
    var px = o.pixel, w, h;
    if (o.width && o.height) { w = o.width / px; h = o.height / px; }
    else if (o.width) { w = o.width / px; h = w * sh / sw; }
    else if (o.height) { h = o.height / px; w = h * sw / sh; }
    else { w = sw / px; h = sh / px; }
    return [Math.max(1, Math.floor(w)), Math.max(1, Math.round(h))];
  }

  function labToRgba(lab, n) {
    var out = new Uint8ClampedArray(n * 4);
    for (var i = 0; i < n; i++) {
      lab2lin(lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2], T3, 0);
      out[i * 4] = lin2s(T3[0]); out[i * 4 + 1] = lin2s(T3[1]); out[i * 4 + 2] = lin2s(T3[2]); out[i * 4 + 3] = 255;
    }
    return out;
  }

  function process(rgba, sw, sh, opts) {
    opts = opts || {};
    if (!PRESETS[opts.preset]) { // 'auto' or unset
      var copy = {};
      for (var key in opts) copy[key] = opts[key];
      copy.preset = detectPreset(rgba, sw, sh);
      opts = copy;
    }
    var o = resolveOptions(opts);
    var size = nativeSize(sw, sh, o), w = size[0], h = size[1], n = w * h, i;
    var scale = Math.sqrt(n / (240 * 180)); // size-dependent constants are tuned at 240x180

    // 1. down to art resolution (area average, linear light). Transparency: unless a background is given,
    //    keep a 1-bit mask, as PC-98 sprites have no partial alpha
    var cover = null, solid = null;
    if (!o.background) for (i = 3; i < rgba.length; i += 4) if (rgba[i] < 250) { cover = new Float32Array(n); break; }
    var lab = resample(rgba, sw, sh, w, h, [S2L[o.bg[0]], S2L[o.bg[1]], S2L[o.bg[2]]], cover);
    if (cover) { solid = new Uint8Array(n); for (i = 0; i < n; i++) solid[i] = cover[i] >= 0.5 ? 1 : 0; }

    // 2. colour grade toward drawn PC-98 colour
    grade(lab, n, o);

    // 3. shapes: flatten a copy, segment it, clean the borders, then give every shape a smooth fill
    var flat = new Float32Array(lab);
    domainTransform(flat, w, h, 6 * scale, o.segSigmaR, 2);
    var seg = segment(flat, w, h, o.segK, Math.max(4, Math.round(o.minRegion * scale * scale)), 0.12);
    tidyRegions(seg, w, h, 2);
    if (o.roundShapes > 0) roundRegions(seg, w, h, Math.round(80 * scale * scale), o.roundShapes);
    var rf = fitRegions(lab, seg, w, h, o, scale), tgt = rf.tgt;

    // 4. inks: 16 from the 4096 grid
    var pal = buildPalette(tgt, n, o, mulberry32(o.seed), solid);
    var T = pairTable(pal, o);

    // 5. fills: flat ink or a two-ink tile pattern per pixel; small shapes are always flat (a pattern needs
    //    room to read as a texture rather than speckle)
    var flatMask = new Uint8Array(n), rsize = new Int32Array(rf.R), minDither = Math.round(o.ditherMinArea * scale * scale);
    for (i = 0; i < n; i++) rsize[rf.rid[i]]++;
    for (i = 0; i < n; i++) flatMask[i] = rsize[rf.rid[i]] < minDither ? 1 : 0;
    var label = choose(tgt, n, flatMask, T, o);
    var index = new Uint8Array(n);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var l = label[y * w + x], a = l & 31, b = (l >> 5) & 31, lv = l >> 10;
        index[y * w + x] = lv && BAYER[(y & 3) * 4 + (x & 3)] < LEVELS[lv - 1] ? b : a;
      }
    }

    // 6. line art on strong shape borders
    var lines = regionLines(rf.rid, tgt, w, h, index, pal, T.plab, o);

    var out = new Uint8ClampedArray(n * 4);
    for (i = 0; i < n; i++) {
      var c = pal[index[i]];
      out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = solid && !solid[i] ? 0 : 255;
    }
    var res = { width: w, height: h, palette: pal, index: index, rgba: out, pixel: o.pixel, preset: o.preset };
    if (o.debug) res.layers = { flat: labToRgba(flat, n), target: labToRgba(tgt, n), lines: lines, regions: rf.R };
    return res;
  }

  function upscale(res, k) { // integer nearest-neighbour
    var w = res.width, h = res.height, W = w * k, out = new Uint8ClampedArray(W * h * k * 4);
    for (var y = 0; y < h * k; y++) {
      var sy = (y / k) | 0;
      for (var x = 0; x < W; x++) {
        var s = (sy * w + ((x / k) | 0)) * 4, d = (y * W + x) * 4;
        out[d] = res.rgba[s]; out[d + 1] = res.rgba[s + 1]; out[d + 2] = res.rgba[s + 2]; out[d + 3] = res.rgba[s + 3];
      }
    }
    return { width: W, height: h * k, data: out };
  }

  // ================================================================ browser wrapper
  function render(src, opts) {
    var doc = root.document;
    var sw = src.naturalWidth || src.videoWidth || src.width, sh = src.naturalHeight || src.videoHeight || src.height;
    var cv = doc.createElement('canvas');
    cv.width = sw; cv.height = sh;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);
    var res = process(ctx.getImageData(0, 0, sw, sh).data, sw, sh, opts);
    var up = upscale(res, res.pixel);
    var out = doc.createElement('canvas');
    out.width = up.width; out.height = up.height;
    out.getContext('2d').putImageData(new ImageData(up.data, up.width, up.height), 0, 0);
    out.style.imageRendering = 'pixelated';
    out.pc98 = { palette: res.palette, width: res.width, height: res.height, preset: res.preset };
    return out;
  }

  var api = { render: render, process: process, upscale: upscale, presets: PRESETS, version: '1.0' };
  root.PC98 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
