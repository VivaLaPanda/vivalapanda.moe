// A room of Panda's house, live: the house's state (/house/state.json, written every minute on the server from the
// home API on rodney) drawn into the room by js/house-render.js. Both rooms follow the real time of day (the
// registers) and show their lamps at their real brightness and colour. What else a room shows is whatever its scene
// has: the living room's blinds come down to their real height, its thermostat's face warms when the heat is on, its
// kotatsu glows when plugged in, its TV shows a picture when on (a moving one when something plays), notes rise off its
// speakers while music plays, and a small readout gives the house's clock and temperature; the bedroom's city lights
// twinkle only after dark. The room's data sets R.house = { base, v, hud }.
// When the feed is down (no file, or older than STALE_MIN) nothing about the devices is known: lamps are off and the
// lines say "unknown", but the time of day still follows the house's clock (worked out here from the sun), so the
// rooms keep working if the feed never comes back. If the scene itself can't load, the room is its static picture.
(function () {
    "use strict";

    var R = window.ROOM;
    var BASE = R.house.base;
    var V = R.house.v;
    var REFRESH_MS = 60 * 1000;         // the file changes every minute
    var STALE_MIN = 30;                 // older than this, the devices are unknown (the feed is down)
    var HOUSE = { tz: "America/Los_Angeles", lat: 37.77, lon: -122.42 };   // for the clock without a feed

    var scene = null, state = null, api = null;
    var overlays = {};                  // id -> element on the stage
    var hud = null, noteTimer = null;
    var tvTimer = null, tvFrame = 0;    // the TV's loop: which frame it's on (kept across redraws)

    // ---------- the state, read for the dialogue (living-room-data.js) ----------

    var H = window.HOUSE = window.HOUSE || {};

    function ageMin() {
        return state ? (Date.now() - Date.parse(state.updated)) / 60000 : Infinity;
    }

    // the state's devices, if it's fresh (a stale one is the house as it was, not as it is)
    function live() {
        return ageMin() <= STALE_MIN;
    }

    function light(lamp) {
        if (!live() || !state.lights || !scene) return null;
        var hit = null;
        state.lights.forEach(function (l) {
            if (scene.light_names[l.name] === lamp && (!hit || l.on)) hit = l;
        });
        return hit;
    }

    function plug(name) {
        if (!live() || !state.plugs) return null;
        var p = state.plugs.filter(function (x) { return x.name === name; })[0];
        return p ? p.on : null;
    }

    function blindPct(name) {
        if (!live() || !state.blinds) return null;
        var b = state.blinds.filter(function (x) { return x.name === name; })[0];
        return b && b.open_pct != null ? b.open_pct : null;
    }

    H.light = light;
    H.lampOn = function (lamp) { var l = light(lamp); return l ? l.on : null; };
    H.climate = function () { return live() ? state.climate : null; };
    H.tv = function () { return live() ? state.tv : null; };
    H.music = function () { return live() ? state.music : null; };
    H.kotatsuOn = function () { return scene && scene.kotatsu ? plug(scene.kotatsu.plug) : null; };
    H.blindPct = blindPct;
    H.redraw = function () { draw(); };

    // ---------- rendering ----------

    function phaseNow() {
        if (live() && scene.phases[state.phase]) return state.phase;
        var p = sunPhase();
        return scene.phases[p] ? p : "noon";
    }

    function lightsNow() {
        var out = {};
        Object.keys(scene.light_names).forEach(function (real) {
            var lamp = scene.light_names[real], l = light(lamp);
            if (l) out[lamp] = l;
        });
        if (scene.lights.daylight) {
            // the day through the glass, as far as the blinds let it in (all of it where the house has no blinds)
            var names = Object.keys(scene.blinds || {}), open = 0, known = 0;
            names.forEach(function (n) { var p = blindPct(n); if (p !== null) { open += p; known++; } });
            out.daylight = { on: true, brightness_pct: known ? Math.max(8, open / known) : 100 };
        }
        var tv = scene.tv && H.tv();
        if (tv && tv.on) out.tv = { on: true, brightness_pct: tv.playing ? 100 : 70 };
        if (scene.kotatsu && H.kotatsuOn()) out.kotatsu = { on: true, brightness_pct: 100 };
        return out;
    }

    // index overrides: the blinds' cloth down to the real position, the thermostat's face when heating
    function overrides() {
        var w = scene.w, n = w * scene.h, o = new Uint8Array(n).fill(255);
        var I = scene.registers;
        Object.keys(scene.blinds || {}).forEach(function (name) {
            var pct = blindPct(name);
            if (pct === null || pct >= 98) return;
            // per column: the roll's foot and the track (both run to the VP), the weave's threads (spaced by depth),
            // and the cloth's mask (nothing over the sofa or the arc lamp, which stand in front)
            var b = scene.blinds[name], cloth = b.mask ? scene.mask[b.mask] : null;
            for (var x = b.x0; x <= b.x1; x++) {
                var i = x - b.x0, top = b.top[i], bot = b.bottom[i];
                var end = Math.round(top + (bot - top) * (100 - pct) / 100);
                for (var y = Math.ceil(top); y <= end; y++) {
                    var p = y * w + x;
                    if (cloth && !cloth[p]) continue;
                    var ink = b.weave[i] ? I.desk : I.paper;              // a cream cloth, a faint weave
                    if (y >= end - 1) ink = y === end ? I.dark : I.wood;  // its bottom bar
                    o[p] = ink;
                }
            }
        });
        // the kotatsu's heater on: the gap under its quilt glows a dim warm red (a checker, so it stays dark-ish)
        if (scene.kotatsu && scene.kotatsu.gap && H.kotatsuOn()) {
            var gap = scene.mask[scene.kotatsu.gap];
            if (gap) for (var q = 0; q < n; q++) if (gap[q]) o[q] = ((q + ((q / w) | 0)) % 2) ? I.red : I.dark;
        }
        var c = scene.thermostat && H.climate();
        if (c && c.heating) {
            var face = scene.mask["mask-thermostat_face.png"];
            for (var p = 0; p < n; p++) if (face[p]) o[p] = (p % 3) ? I.bedspread : I.red;
        }
        return o;
    }

    function stateNow(extra) {
        return { phase: phaseNow(), lights: lightsNow(), override: extra || overrides() };
    }

    function draw() {
        if (!scene || !api) return;
        var wait = HouseRender.need(scene, phaseNow(), lightsNow());
        if (wait) { wait.then(draw); return; }          // a lamp just came on, or a new time of day: its file first
        var ov = overrides();
        var px = HouseRender.renderPixels(scene, stateNow(ov));
        api.art.src = HouseRender.toURL(px, scene.w, scene.h, 4);
        if (scene.tv) drawTV();
        if (scene.speakers) drawMusic();
        if (R.house.hud) drawHud();
        if (scene.twinkle_phases) {
            var tw = document.getElementById("room-twinkle");
            if (tw) tw.hidden = scene.twinkle_phases.indexOf(phaseNow()) < 0;
        }
    }

    function overlay(id, tag) {
        var node = overlays[id];
        if (!node) {
            node = document.createElement(tag || "div");
            node.className = "lr-layer";
            node.setAttribute("aria-hidden", "true");
            api.stage.insertBefore(node, api.svg);
            overlays[id] = node;
        }
        return node;
    }

    // the TV: its picture already projected onto the glass (scene.tv); playing, a loop of frames in a grid, stepped
    // one way round at its own pace (the last frame leads into the first, so it never runs back)
    function drawTV() {
        var tv = H.tv(), s = scene.tv.screen, play = scene.tv.play;
        var node = overlay("tv");
        clearInterval(tvTimer);
        tvTimer = null;
        if (!tv || !tv.on) { node.hidden = true; return; }
        node.hidden = false;
        node.className = "lr-layer lr-tv";
        api.placeNative(node, s.x, s.y, s.w, s.h);
        if (!tv.playing) {
            node.style.backgroundImage = "url(" + BASE + scene.tv.backdrop + "?v=" + V + ")";
            node.style.backgroundSize = node.style.backgroundPosition = "";
            return;
        }
        var cols = play.cols, rows = Math.ceil(play.frames / cols);
        node.style.backgroundImage = "url(" + BASE + play.src + "?v=" + V + ")";
        node.style.backgroundSize = cols * 100 + "% " + rows * 100 + "%";
        function show() {
            var c = tvFrame % cols, r = Math.floor(tvFrame / cols);
            node.style.backgroundPosition = (cols > 1 ? c / (cols - 1) * 100 : 0) + "% " +
                                            (rows > 1 ? r / (rows - 1) * 100 : 0) + "%";
        }
        show();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        tvTimer = setInterval(function () {
            if (document.hidden) return;
            tvFrame = (tvFrame + 1) % play.frames;
            show();
        }, 1000 / play.fps);
    }

    function drawMusic() {
        var m = H.music(), playing = !!(m && m.playing);
        clearInterval(noteTimer);
        scene.speakers.at.forEach(function (a, i) {
            var led = overlay("led" + i);
            led.className = "lr-layer lr-led";
            api.placeNative(led, a[0] - 2, a[1] - 4, 4, 1);
            led.hidden = !playing;
        });
        if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var k = 0;
        noteTimer = setInterval(function () {
            if (document.hidden) return;
            var a = scene.speakers.at[k++ % scene.speakers.at.length];
            var n = document.createElement("img");
            n.src = BASE + scene.speakers.note + "?v=" + V;
            n.alt = "";
            n.className = "lr-layer lr-note";
            api.placeNative(n, a[0] - 2, a[1] - 14, 6, 8);
            api.stage.insertBefore(n, api.svg);
            setTimeout(function () { n.remove(); }, 2600);
        }, 900);
    }

    function drawHud() {
        if (!hud) {
            hud = document.createElement("div");
            hud.id = "lr-hud";
            hud.setAttribute("role", "status");
            api.stage.appendChild(hud);
        }
        var parts = [houseClock(), phaseNow().toUpperCase()];
        var c = H.climate();
        if (c && c.temperature_f != null) parts.push(Math.round(c.temperature_f) + "°F");
        var age = ageMin();
        if (age > STALE_MIN) parts.push(isFinite(age) ? "offline since " + Math.round(age / 60) + "h ago" : "offline");
        hud.textContent = parts.join(" · ");
        hud.title = "Panda's real house, updated every minute";
    }

    // ---------- the house's clock and the sun (for when the feed can't say) ----------

    // the house's UTC offset in minutes: from the feed (its local_time against updated), else from its time zone
    function offsetMin() {
        var hm = state && /^(\d\d):(\d\d)$/.exec(state.local_time || "");
        var u = state && new Date(state.updated);
        if (hm && !isNaN(u)) {
            var off = (+hm[1] * 60 + +hm[2]) - (u.getUTCHours() * 60 + u.getUTCMinutes());
            off = ((off + 720) % 1440 + 1440) % 1440 - 720;          // into -12h..+12h
            return Math.round(off / 15) * 15;
        }
        try {
            var now = new Date();
            var p = new Intl.DateTimeFormat("en-US", { timeZone: HOUSE.tz, hour: "numeric", minute: "numeric",
                                                       hourCycle: "h23" }).formatToParts(now);
            var get = function (t) { return +p.filter(function (x) { return x.type === t; })[0].value; };
            var o = get("hour") * 60 + get("minute") - (now.getUTCHours() * 60 + now.getUTCMinutes());
            return ((o + 720) % 1440 + 1440) % 1440 - 720;
        } catch (e) {
            return -new Date().getTimezoneOffset();               // this browser's own, as a last resort
        }
    }

    // the house's time now, as a Date whose UTC fields read as the house's wall clock (so the readout ticks instead of
    // showing the feed's minute-old time)
    function houseNow() {
        return new Date(Date.now() + offsetMin() * 60000);
    }

    function houseClock() {
        var t = houseNow();
        var pad = function (n) { return (n < 10 ? "0" : "") + n; };
        return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes());
    }

    // the time of day from the sun at the house, with the home API's edges (home-mcp house.py sun_phase): sunrise,
    // sunset (sun at -0.833 deg), dawn and dusk (-6 deg) from the usual approximations (declination and the equation of
    // time by day of year), good to a few minutes, which is plenty for a fallback
    function sunPhase() {
        var t = houseNow(), rad = Math.PI / 180;
        var n = Math.floor((Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) -
                            Date.UTC(t.getUTCFullYear(), 0, 0)) / 86400000);
        var decl = 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365) * rad;
        var B = 2 * Math.PI * (n - 81) / 364;
        var eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);   // minutes
        var noon = 720 - 4 * HOUSE.lon - eot + offsetMin();          // the sun's highest, in house minutes
        function half(alt) {                                           // minutes from noon to the sun at `alt`
            var c = (Math.sin(alt * rad) - Math.sin(HOUSE.lat * rad) * Math.sin(decl)) /
                    (Math.cos(HOUSE.lat * rad) * Math.cos(decl));
            return Math.acos(Math.max(-1, Math.min(1, c))) / rad * 4;
        }
        var rise = noon - half(-0.833), set = noon + half(-0.833);
        var dawn = noon - half(-6), dusk = noon + half(-6);
        var m = t.getUTCHours() * 60 + t.getUTCMinutes();
        var edges = [[dawn, "dawn"], [rise, "morning"], [noon - 60, "noon"], [noon + 60, "afternoon"],
                     [set - 120, "evening"], [set - 20, "sunset"], [set + 10, "dusk"], [dusk, "night"]];
        var phase = "night";
        edges.forEach(function (e) { if (m >= e[0]) phase = e[1]; });
        return phase;
    }

    // ---------- loading ----------

    function getState() {
        return fetch("/house/state.json", { cache: "no-cache" }).then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        }).then(function (s) { state = s; }, function (err) {
            console.warn("house state unavailable:", err);
        });
    }

    // room.js waits for this before building: the hotspots' outlines come from the scene, and the first frame's files
    // (the state comes in alongside, so the room starts drawn as the house is)
    var firstState = getState();
    R.ready = Promise.all([HouseRender.load(BASE, V), firstState]).then(function (got) {
        scene = got[0];
        R.objects.concat(R.knickKnacks || []).forEach(function (o) {
            var hs = scene.hotspots[o.id];
            if (!hs) return;
            if (hs.polygon && !o.polygon) {
                o.polygon = hs.polygon;
                o.anchor = hs.anchor;
            }
        });
        return HouseRender.need(scene, phaseNow(), lightsNow());
    }).catch(function (err) {
        scene = null;                                    // the room stays the picture it was drawn as
        console.warn("house scene unavailable:", err);
        R.objects.forEach(function (o) {                 // (the doors still work)
            if (!o.polygon && o.fallback) {
                o.polygon = o.fallback;
                o.anchor = [Math.round((o.fallback[0][0] + o.fallback[1][0]) / 2), Math.round((o.fallback[0][1] + o.fallback[2][1]) / 2)];
            }
        });
    });

    R.onBuilt = function (a) {
        api = a;
        draw();
        setInterval(function () {
            if (!document.hidden) getState().then(draw);
        }, REFRESH_MS);
        if (R.house.hud) setInterval(drawHud, 20000);
    };
})();
