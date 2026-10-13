// Explore's ambient life: particles over the picture in its own inks (fireflies, steam, rain, snow, petals,
// fireworks, a beacon...), the rooftop's shooting stars, sound beds under the music, and Halloween's pumpkins.
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE, X = window.EXPLORE;
    var P = X.P, RAINY = X.RAINY, SNOWY = X.SNOWY, arr = X.arr, frame = X.frame, get = X.get,
        halloween = X.halloween, obj = X.obj, place = X.place, put = X.put, raining = X.raining, rand = X.rand,
        spring = X.spring, winter = X.winter;
    var PLAY = {};   // place id -> its setup, run once this file has loaded

    // ---------- ambient life: particles over the picture, in its own inks ----------

    // a canvas over the scene at a quarter of its 740x528 (each dot one fat pixel, like the art's), not clickable;
    // draw(ctx, dt, t) each frame; still for visitors who prefer less motion
    function ambient(draw) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        document.addEventListener("scenestart", function () {
            var cv = document.createElement("canvas");
            cv.width = 185;
            cv.height = 132;
            cv.className = "play-ambient";
            S.stage.appendChild(cv);
            var ctx = cv.getContext("2d"), last = performance.now();
            (function step(now) {
                var dt = Math.min(.1, (now - last) / 1000);
                last = now;
                if (!document.hidden) { ctx.clearRect(0, 0, 185, 132); draw(ctx, dt, now / 1000); }
                requestAnimationFrame(step);
            })(last);
        });
    }

    function fireflies(region, n, core, glow) {   // region [x, y, w, h] in canvas px
        var flies = [];
        for (var i = 0; i < n; i++) {
            flies.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]),
                         a: rand(0, 6.28), phase: rand(0, 6.28), rate: rand(.5, 1.1) });
        }
        ambient(function (ctx, dt, t) {
            flies.forEach(function (f) {
                f.a += rand(-1.2, 1.2) * dt;
                f.x += Math.cos(f.a) * 3 * dt;
                f.y += Math.sin(f.a) * 2 * dt;
                if (f.x < region[0] || f.x > region[0] + region[2]) f.a = Math.PI - f.a;
                if (f.y < region[1] || f.y > region[1] + region[3]) f.a = -f.a;
                var b = Math.sin(t * f.rate * 2 + f.phase);   // a slow blink: dark half the time
                if (b < .1) return;
                var x = Math.round(f.x), y = Math.round(f.y);
                if (b > .6) {
                    ctx.fillStyle = glow;
                    ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
                }
                ctx.fillStyle = core;
                ctx.fillRect(x, y, 1, 1);
            });
        });
    }

    function steam(region, inks, most) {   // wisps rising off water, thinning as they go (dithered, never blended)
        var puffs = [];
        most = most || 44;
        ambient(function (ctx, dt, t) {
            if (puffs.length < most && Math.random() < dt * most / 3) {
                puffs.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]),
                             age: 0, life: rand(2.5, 4.5), drift: rand(-2, 2), ink: inks[Math.floor(Math.random() * inks.length)] });
            }
            puffs = puffs.filter(function (p) { return p.age < p.life; });
            puffs.forEach(function (p) {
                p.age += dt;
                p.y -= 5 * dt;
                p.x += (p.drift + Math.sin(t + p.y * .3)) * dt;
                var k = p.age / p.life, x = Math.round(p.x), y = Math.round(p.y), frame = Math.floor(t * 6);
                ctx.fillStyle = p.ink;
                // a 5x3 wisp, fewer of its pixels as it fades: a checker that thins out
                for (var dy = 0; dy < 3; dy++) {
                    for (var dx = 0; dx < 5; dx++) {
                        if ((dy === 0 || dy === 2) && (dx === 0 || dx === 4)) continue;   // rounded
                        if ((dx + dy + frame) % 2 && k > .3) continue;
                        if (k > .7 && (dx + dy * 2 + frame) % 3) continue;
                        ctx.fillRect(x + dx, y + dy, 1, 1);
                    }
                }
            });
        });
    }

    // a train's headlights coming up the tunnel now and then: two dots from the vanishing point, spreading and
    // growing, a flash as it reaches the platform (vp: the tunnel's vanishing point, canvas px)
    function headlights(vp, every) {
        var next = 6, t = -1;
        ambient(function (ctx, dt) {
            next -= dt;
            if (t < 0 && next <= 0) { t = 0; next = every + rand(0, every / 2); }
            if (t < 0) return;
            t += dt / 3.2;
            if (t >= 1) { t = -1; return; }
            var k = t * t * t, gap = 1 + k * 40, size = Math.max(1, Math.round(k * 5)), y = vp[1] + k * 50;
            [-1, 1].forEach(function (side) {
                var x = Math.round(vp[0] + side * gap / 2);
                ctx.fillStyle = "#ffddbb";
                for (var dy = -size; dy <= size; dy++) {       // a dithered glow round each lamp
                    for (var dx = -size; dx <= size; dx++) {
                        if ((dx + dy) % 2 === 0 && dx * dx + dy * dy <= size * size * 2) ctx.fillRect(x + dx, Math.round(y) + dy, 1, 1);
                    }
                }
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - (size >> 1), Math.round(y) - (size >> 1), Math.max(1, size), Math.max(1, size));
            });
            if (t > .9) {                                      // it's here: the platform lights up for a moment
                ctx.fillStyle = "rgba(255,255,230," + (1 - t) * 4 + ")";
                ctx.fillRect(0, 0, 185, 132);
            }
        });
    }

    function rain() {
        var drops = [], splashes = [];
        for (var i = 0; i < 120; i++) drops.push({ x: rand(0, 200), y: rand(-132, 132), v: rand(140, 190) });
        ambient(function (ctx, dt) {
            ctx.fillStyle = "#bbccff";
            drops.forEach(function (d) {
                d.y += d.v * dt;
                d.x -= d.v * .25 * dt;
                if (d.y > 132) {
                    if (Math.random() < .5) splashes.push({ x: d.x, y: rand(110, 131), age: 0 });
                    d.y = rand(-20, 0);
                    d.x = rand(0, 215);
                }
                for (var k = 0; k < 5; k++) ctx.fillRect(Math.round(d.x + k * .25), Math.round(d.y - k), 1, 1);   // a streak
            });
            splashes = splashes.filter(function (sp) { return (sp.age += dt) < .15; });
            splashes.forEach(function (sp) {
                ctx.fillRect(Math.round(sp.x - 1), Math.round(sp.y), 1, 1);
                ctx.fillRect(Math.round(sp.x + 1), Math.round(sp.y), 1, 1);
            });
        });
    }

    // the rooftop's shooting stars: one now and then; click the sky while it's falling to wish on it
    var starAt = -1e9;
    function shootingStars() {
        var star = null, next = 4;
        ambient(function (ctx, dt, t) {
            next -= dt;
            if (!star && next <= 0) {
                star = { x: rand(60, 180), y: rand(4, 30), age: 0 };
                next = rand(6, 14);
                starAt = performance.now();
            }
            if (!star) return;
            star.age += dt;
            var k = star.age / .9;
            if (k >= 1) { star = null; return; }
            var hx = star.x - k * 55, hy = star.y + k * 22;
            for (var i = 0; i < 9; i++) {                      // a tail that thins out
                if (i > 3 && i % 2) continue;
                ctx.fillStyle = i < 2 ? "#ffffff" : "#aaccff";
                ctx.fillRect(Math.round(hx + i * 2.5), Math.round(hy - i), 1, 1);
            }
        });
    }

    PLAY.rooftop = function () {
        shootingStars();
        obj("sky").lines = function () {
            var p = P();
            if (performance.now() - starAt > 1500) return arr(p.no_star);
            var n = +(get("pandaWishes") || 0) + 1;
            put("pandaWishes", n);
            return n === 3 ? arr(p.third_wish) : [p.wishes[Math.floor(Math.random() * p.wishes.length)]];
        };
    };

    // a beacon's beam sweeping round from a light (canvas px), seen side-on: it reaches out left, shrinks as it
    // turns toward you (a flash), reaches out right, then goes round the back
    function beacon(o) {
        ambient(function (ctx, dt, t) {
            var a = t * .8, reach = Math.cos(a), front = Math.sin(a);
            if (front < -.6) return;                                 // round the back
            if (front > .92) {                                       // facing us
                ctx.fillStyle = "#ffffff";
                for (var r = 1; r < 4; r++) for (var k = 0; k < 8; k++) ctx.fillRect(Math.round(o[0] + Math.cos(k) * r), Math.round(o[1] + Math.sin(k) * r), 1, 1);
            }
            var len = 30 + 110 * Math.abs(reach), dir = reach < 0 ? -1 : 1;
            for (var d = 2; d < len; d++) {                           // a widening cone, dithered thinner with distance
                var half = 1 + d * .1, x = Math.round(o[0] + dir * d);
                for (var w = -half; w <= half; w++) {
                    var y = Math.round(o[1] - d * .16 + w);   // up over the dark sky
                    if ((x + y) % 2 || (d > 70 && (x * 3 + y) % 3 === 0)) continue;
                    ctx.fillStyle = d < 10 ? "#ffffff" : "#ffff00";
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });
    }

    // water rushing past a boat: streaks born at the river's vanishing point that grow and spread toward you,
    // hidden behind the bow (picture px, mapped to the canvas with s and ox)
    function river(vp, s, ox, bow) {
        var streaks = [];
        function at(sx, sy) { return [(sx * s - ox) / 4, sy * s / 4]; }
        ambient(function (ctx, dt) {
            if (streaks.length < 40 && Math.random() < dt * 20) streaks.push({ p: 0, lane: rand(-1, 1), v: rand(.35, .55) });
            streaks = streaks.filter(function (k) { return k.p < 1; });
            streaks.forEach(function (k) {
                k.p += k.v * dt * (0.4 + k.p * 1.6);                // slow far away, quick up close
                var sx = vp[0] + k.lane * (6 + k.p * 70), sy = vp[1] + k.p * k.p * 55;
                if (sx > bow[0] && sx < bow[1] && sy > bow[2]) return;
                var c = at(sx, sy), len = 1 + Math.round(k.p * 4);
                ctx.fillStyle = k.p < .5 ? "#bbbbcc" : "#ffffff";
                ctx.fillRect(Math.round(c[0]), Math.round(c[1]), len, 1);
            });
        });
    }

    // jellyfish drifting up in the water outside the aquarium's tunnel, their bells pulsing
    function jellyfish(n, region) {
        var jellies = [];
        for (var i = 0; i < n; i++) jellies.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]), ph: rand(0, 6.28), v: rand(1.5, 3) });
        ambient(function (ctx, dt, t) {
            jellies.forEach(function (j) {
                j.y -= j.v * dt;
                if (j.y < region[1] - 10) { j.y = region[1] + region[3]; j.x = rand(region[0], region[0] + region[2]); }
                var pulse = Math.sin(t * 2.4 + j.ph), w = 3 + (pulse > 0 ? 1 : 0), x = Math.round(j.x + Math.sin(t * .6 + j.ph) * 3), y = Math.round(j.y);
                ctx.fillStyle = "#70d0f1";
                for (var dx = -w; dx <= w; dx++) ctx.fillRect(x + dx, y + 2, 1, 1);                  // the bell's rim
                for (var dx2 = -w + 1; dx2 <= w - 1; dx2++) ctx.fillRect(x + dx2, y + 1, 1, 1);
                for (var dx3 = -w + 2; dx3 <= w - 2; dx3++) ctx.fillRect(x + dx3, y, 1, 1);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - 1, y + 1, 1, 1);
                ctx.fillStyle = "#4b98e0";
                for (var k = -1; k <= 1; k++) {                                                      // tentacles, waving
                    for (var l = 0; l < 4; l++) ctx.fillRect(x + k * 2 + Math.round(Math.sin(t * 3 + l + k) * .8), y + 3 + l, 1, 1);
                }
            });
        });
    }

    // the festival's fireworks, far off over the skyline: a rocket, a burst of dithered sparks that fall and fade
    function fireworks(region, inks, every) {
        var shells = [], next = 3;
        ambient(function (ctx, dt) {
            next -= dt;
            if (next <= 0) {
                next = rand(every * .5, every * 1.5);
                shells.push({ x: rand(region[0], region[0] + region[2]), y: region[1] + region[3], top: rand(region[1], region[1] + region[3] * .6),
                              t: 0, ink: inks[Math.floor(Math.random() * inks.length)], sparks: null });
            }
            shells = shells.filter(function (sh) { return sh.t < 3.2; });
            shells.forEach(function (sh) {
                sh.t += dt;
                if (!sh.sparks) {                                         // rising
                    sh.y -= 30 * dt;
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 1, 1);
                    if (sh.y <= sh.top) {
                        sh.sparks = [];
                        for (var i = 0; i < 18; i++) { var a = i / 18 * 6.28; sh.sparks.push({ a: a, v: rand(7, 10) }); }
                        sh.burst = sh.t;
                    }
                    return;
                }
                var k = sh.t - sh.burst;
                if (k > 1.8) return;
                sh.sparks.forEach(function (sp, i) {
                    if (k > 1.1 && (i + Math.floor(k * 10)) % 2) return;     // thinning as they fade
                    var r = sp.v * Math.min(k, .8) / .8 * 1.6;
                    ctx.fillStyle = k < .3 ? "#ffffff" : sh.ink;
                    ctx.fillRect(Math.round(sh.x + Math.cos(sp.a) * r), Math.round(sh.top + Math.sin(sp.a) * r + k * k * 3), 1, 1);
                });
            });
        });
    }

    // a campfire's embers: sparks rising, wobbling, winking out
    function embers(at) {
        var sparks = [];
        ambient(function (ctx, dt) {
            if (Math.random() < dt * 14) sparks.push({ x: at[0] + rand(-4, 4), y: at[1], life: rand(1, 2.2), age: 0, wob: rand(0, 6) });
            sparks = sparks.filter(function (sp) { return (sp.age += dt) < sp.life; });
            sparks.forEach(function (sp) {
                sp.y -= 9 * dt;
                var x = Math.round(sp.x + Math.sin(sp.age * 4 + sp.wob) * 1.5);
                ctx.fillStyle = sp.age < sp.life * .5 ? "#ffdd66" : "#ff7733";
                if (sp.age < sp.life * .85 || Math.floor(sp.age * 20) % 2) ctx.fillRect(x, Math.round(sp.y), 1, 1);
            });
        });
    }

    // laundry tumbling behind a washing machine's round window: a few socks and shirts going round, with a lurch
    function tumble(c, r) {
        var bits = [{ a: 0, ink: "#c06a6a" }, { a: 2.1, ink: "#e8e0c8" }, { a: 4.2, ink: "#7a9ac8" }, { a: 1, ink: "#d8c070" }];
        ambient(function (ctx, dt, t) {
            var spin = t * 3 + Math.sin(t * 1.3) * .8;
            bits.forEach(function (b, i) {
                var a = b.a + spin, rr = r * (.45 + .25 * Math.sin(t * 2 + i));
                ctx.fillStyle = b.ink;
                var x = Math.round(c[0] + Math.cos(a) * rr), y = Math.round(c[1] + Math.sin(a) * rr + 1);
                ctx.fillRect(x, y, 2, 1);
                ctx.fillRect(x, y + 1, 1, 1);
            });
        });
    }

    // a soft noise bed under the music (made, not recorded: no files): rain on the night streets, crickets in the
    // hills at night. Only after a touch (browsers' sound rules) and never if the visitor muted the site
    function soundBed(kind) {
        var started = false;
        function start() {
            if (started) return;
            started = true;
            var muted = false;
            try { muted = localStorage.getItem("muted") === "true"; } catch (e) { /* storage blocked */ }
            var AC = window.AudioContext || window.webkitAudioContext;
            if (muted || !AC) return;
            var ac = new AC(), out = ac.createGain();
            out.gain.value = 0;
            out.connect(ac.destination);
            var level = kind === "crickets" ? .03 : .05;
            out.gain.linearRampToValueAtTime(level, ac.currentTime + 3);
            if (kind === "waves") {                       // low noise swelling and falling, like water on sand
                var wl = ac.sampleRate * 4, wb = ac.createBuffer(1, wl, ac.sampleRate), wd = wb.getChannelData(0), wlast = 0;
                for (var wi = 0; wi < wl; wi++) { wlast = (wlast + .02 * (Math.random() * 2 - 1)) / 1.02; wd[wi] = wlast * 3.5; }
                var ws = ac.createBufferSource(), lp = ac.createBiquadFilter(), swell = ac.createGain(), lfo = ac.createOscillator(), depth = ac.createGain();
                ws.buffer = wb; ws.loop = true; lp.type = "lowpass"; lp.frequency.value = 500;
                lfo.frequency.value = .12; depth.gain.value = .5; swell.gain.value = .6;
                lfo.connect(depth); depth.connect(swell.gain);
                ws.connect(lp); lp.connect(swell); swell.connect(out); ws.start(); lfo.start();
            } else if (kind === "rain") {                        // brown-ish noise through a bandpass: rain on pavement
                var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0), last = 0;
                for (var i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
                var src = ac.createBufferSource(), bp = ac.createBiquadFilter();
                src.buffer = buf; src.loop = true; bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = .4;
                src.connect(bp); bp.connect(out); src.start();
            } else {                                      // crickets: short chirps on a high tone, irregular
                (function chirp() {
                    var t = ac.currentTime;
                    for (var k = 0; k < 3; k++) {
                        var o = ac.createOscillator(), g = ac.createGain();
                        o.frequency.value = 4200 + Math.random() * 300; g.gain.value = 0;
                        g.gain.setValueAtTime(0, t + k * .06); g.gain.linearRampToValueAtTime(.5, t + k * .06 + .01);
                        g.gain.linearRampToValueAtTime(0, t + k * .06 + .04);
                        o.connect(g); g.connect(out); o.start(t + k * .06); o.stop(t + k * .06 + .05);
                    }
                    setTimeout(chirp, rand(500, 1800));
                })();
            }
            var mute = document.getElementById("mute");   // the site's speaker button mutes this too
            if (mute) mute.addEventListener("click", function () { out.gain.value = out.gain.value ? 0 : level; });
        }
        ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, start, { once: true }); });
    }
    if (RAINY.indexOf(place) >= 0 && (raining() || /[?&]rain\b/.test(location.search))) soundBed("rain");
    if (place === "campsite") soundBed("crickets");
    // Platform 1's arrival chime: four soft notes, once, on your first touch (made in the browser)
    if (place === "trainplatform") {
        ["pointerdown", "keydown"].forEach(function (ev) {
            document.addEventListener(ev, function chime() {
                ["pointerdown", "keydown"].forEach(function (e2) { document.removeEventListener(e2, chime); });
                var muted = false;
                try { muted = localStorage.getItem("muted") === "true"; } catch (e) { /* blocked */ }
                var AC = window.AudioContext || window.webkitAudioContext;
                if (muted || !AC) return;
                var ac = new AC();
                [659, 523, 587, 392].forEach(function (f, i) {       // E C D G, the classic station chime
                    var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * .45;
                    o.type = "sine"; o.frequency.value = f;
                    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + 1.2);
                    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.3);
                });
            });
        });
    }
    if (["beach", "harbour", "lighthouse", "sunset"].indexOf(place) >= 0) soundBed("waves");

    if (SNOWY.indexOf(place) >= 0 && spring()) {
        var blossoms = [];
        for (var bi = 0; bi < 40; bi++) blossoms.push({ x: rand(0, 185), y: rand(0, 132), v: rand(6, 12), ph: rand(0, 6) });
        ambient(function (ctx, dt, t) {
            blossoms.forEach(function (f, i) {
                f.y += f.v * dt; f.x += Math.sin(t * 1.3 + f.ph) * 6 * dt - 2 * dt;
                if (f.y > 132 || f.x < -2) { f.y = -2; f.x = rand(0, 200); }
                ctx.fillStyle = i % 3 ? "#ffb7c9" : "#ffe0e8";
                ctx.fillRect(Math.round(f.x), Math.round(f.y), (Math.floor(t * 3 + i) % 2) + 1, 1);   // a petal, turning
            });
        });
    }
    if (SNOWY.indexOf(place) >= 0 && winter()) {
        var flakes = [];
        for (var fi = 0; fi < 70; fi++) flakes.push({ x: rand(0, 185), y: rand(0, 132), v: rand(5, 11), ph: rand(0, 6) });
        ambient(function (ctx, dt, t) {
            ctx.fillStyle = "#ffffff";
            flakes.forEach(function (f) {
                f.y += f.v * dt;
                if (f.y > 132) { f.y = -2; f.x = rand(0, 185); }
                ctx.fillRect(Math.round(f.x + Math.sin(t * .8 + f.ph) * 2), Math.round(f.y), 1, 1);
            });
        });
    }

    // shrine petals on the river, drifting downstream
    function petals(region, n) {
        var ps = [];
        for (var i = 0; i < n; i++) ps.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]), v: rand(2, 4) });
        ambient(function (ctx, dt, t) {
            ps.forEach(function (p, i) {
                p.x -= p.v * dt; p.y += p.v * .5 * dt;
                if (p.x < region[0] || p.y > region[1] + region[3]) { p.x = region[0] + region[2]; p.y = rand(region[1], region[1] + region[3] * .5); }
                ctx.fillStyle = (i + Math.floor(t * 2)) % 3 ? "#e86a8a" : "#ffb0c4";
                ctx.fillRect(Math.round(p.x), Math.round(p.y + Math.sin(t + i) * .6), 1, 1);
            });
        });
    }

    var AMBIENT = {
        underbridge: function () { petals([75, 60, 110, 70], 14); },
        laundromat: function () { tumble([8, 96], 5); },
        campsite: function () { embers([92, 72]); },
        rooftop: function () { fireworks([20, 30, 150, 30], ["#ffddbb", "#aaccff", "#eebb11"], 7); },
        penthouse: function () { fireworks([30, 15, 120, 25], ["#ff6688", "#ffdd55", "#88ddff"], 9); },
        aquarium: function () { jellyfish(7, [8, 6, 170, 70]); },
        riverboat: function () { river([175, 139], 528 / 273, 63.2, [148, 192, 158]); },
        harbour: function () { beacon([37, 43]); },
        trainplatform: function () { headlights([130, 46], 30); },
        forestedge: function () { fireflies([0, 25, 152, 66], 18, "#ffffff", "#99cc66"); },
        smallbathhouse: function () { steam([0, 64, 185, 28], ["#ffffff", "#bdceff"]); },
        ramen: function () {   // off the two pots, either side of the chef (not over his face)
            steam([80, 62, 17, 3], ["#ffffff", "#ffddcc"], 12);
            steam([120, 61, 16, 3], ["#ffffff", "#ffddcc"], 12);
        }
    };
    var SKYLINE = { rooftop: 1, penthouse: 1 };   // the festival's fireworks, once you've been to it
    if (AMBIENT[place] && (!SKYLINE[place] || get("pandaVisits_festival"))) AMBIENT[place]();
    if (RAINY.indexOf(place) >= 0 && (raining() || /[?&]rain\b/.test(location.search))) rain();   // ?rain to see it

    var PUMPKINS = { mainstreet: [[130, 470], [470, 476]], festival: [[200, 488]], shrine: [[250, 500]] };
    if (PUMPKINS[place] && halloween()) {
        document.addEventListener("scenestart", function () {
            PUMPKINS[place].forEach(function (xy) {
                var im = document.createElement("img");
                im.src = "/img/explore/layers/pumpkin.png";
                im.alt = "";
                im.className = "scene-layer scene-pixel scene-anim-flicker";
                S.placeNative(im, xy[0], xy[1], 23, 19);
                S.stage.appendChild(im);
            });
        });
    }

    if (PLAY[place]) PLAY[place]();
})();
